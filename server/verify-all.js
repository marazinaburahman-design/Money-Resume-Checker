import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:4000';

// Minimal valid PDF with real extractable developer text
const developerPdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>/Contents 4 0 R>>endobj
4 0 obj<</Length 170>>stream
BT
/F1 12 Tf
72 700 Td (Jane Doe - Full-Stack Developer) Tj
0 -20 Td (Skills: JavaScript, TypeScript, React, Node.js, Express, Git, HTML, CSS) Tj
0 -20 Td (Built full-stack web applications with REST APIs and MongoDB) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000262 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref
485
%%EOF`;

// Minimal valid PDF with NO text stream (scanned / empty)
const emptyPdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj
4 0 obj<</Length 0>>stream
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000216 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref
265
%%EOF`;

function extractCookie(res) {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(/token=([^;]+)/);
  return match ? `token=${match[1]}` : null;
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(maxAttempts = 25) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) return true;
    } catch {
      await delay(300);
    }
  }
  return false;
}

async function runAllChecks() {
  console.log('Spawning backend server...');
  const serverProcess = spawn('node', ['src/index.js'], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout.on('data', () => {});
  serverProcess.stderr.on('data', (d) => {
    console.error(`[SERVER ERR] ${d.toString().trim()}`);
  });

  const testResults = [];

  try {
    const ready = await waitForServer();
    if (!ready) {
      throw new Error('Server failed to start within timeout.');
    }
    console.log('Server is healthy and responding on port 4000.\n');

    // 1. Health check
    {
      const res = await fetch(`${BASE_URL}/api/health`);
      const body = await res.json();
      const pass = res.status === 200 && body.status === 'ok';
      testResults.push({ name: 'Health check (GET /api/health)', pass, detail: `Status: ${res.status}` });
    }

    // 2. Unauthenticated access blocked on protected endpoints (401)
    {
      const resAnalyze = await fetch(`${BASE_URL}/api/analyze`, { method: 'POST' });
      const resList = await fetch(`${BASE_URL}/api/analyses`);
      const pass = resAnalyze.status === 401 && resList.status === 401;
      testResults.push({
        name: 'Protected endpoints require authentication (401)',
        pass,
        detail: `POST /api/analyze: ${resAnalyze.status}, GET /api/analyses: ${resList.status}`,
      });
    }

    // 3. Register User 1
    const user1Email = `candidate_${Date.now()}@example.com`;
    let user1Cookie = null;
    let user1Id = null;
    {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Candidate',
          email: user1Email,
          password: 'Password123!',
        }),
      });
      const body = await res.json();
      user1Cookie = extractCookie(res);
      user1Id = body.user?.id;

      const pass =
        res.status === 201 &&
        body.success === true &&
        typeof user1Cookie === 'string' &&
        user1Cookie.includes('token=') &&
        body.user?.email === user1Email.toLowerCase() &&
        body.user?.password === undefined;

      testResults.push({
        name: 'Register User 1 with hashed password and HTTP-only cookie (201)',
        pass,
        detail: `Status: ${res.status}, UserID: ${user1Id}, HasCookie: ${Boolean(user1Cookie)}`,
      });
    }

    // 4. Duplicate email registration rejected (409)
    {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Candidate Duplicate',
          email: user1Email,
          password: 'AnotherPassword123!',
        }),
      });
      const body = await res.json();
      const pass = res.status === 409 && body.success === false && body.error.includes('already exists');
      testResults.push({
        name: 'Duplicate email registration rejected (409)',
        pass,
        detail: `Status: ${res.status}, Error: "${body.error}"`,
      });
    }

    // 5. Short password registration rejected (400)
    {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Short Pass',
          email: `short_${Date.now()}@example.com`,
          password: '123',
        }),
      });
      const body = await res.json();
      const pass = res.status === 400 && body.success === false && body.error.includes('at least 6 characters');
      testResults.push({
        name: 'Weak password (< 6 chars) rejected (400)',
        pass,
        detail: `Status: ${res.status}, Error: "${body.error}"`,
      });
    }

    // 6. Login User 1
    {
      // Wrong password
      const resBad = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user1Email, password: 'WrongPassword!' }),
      });
      const bodyBad = await resBad.json();

      // Correct password
      const resGood = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user1Email, password: 'Password123!' }),
      });
      const bodyGood = await resGood.json();

      const pass =
        resBad.status === 401 &&
        bodyBad.success === false &&
        resGood.status === 200 &&
        bodyGood.success === true &&
        bodyGood.user?.id === user1Id;

      testResults.push({
        name: 'User 1 login with password verification (401 on wrong, 200 on correct)',
        pass,
        detail: `Bad: ${resBad.status}, Good: ${resGood.status}`,
      });
    }

    // 7. Verify session endpoint (GET /api/auth/me)
    {
      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Cookie: user1Cookie },
      });
      const body = await res.json();
      const pass = res.status === 200 && body.success === true && body.user?.id === user1Id;
      testResults.push({
        name: 'Current user session verified (GET /api/auth/me -> 200)',
        pass,
        detail: `Status: ${res.status}, Authenticated User: "${body.user?.name}"`,
      });
    }

    // 8. PDF Validation with authenticated User 1
    {
      // Missing file
      const formMissing = new FormData();
      formMissing.append('role', 'Frontend Developer');
      const resMissing = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { Cookie: user1Cookie },
        body: formMissing,
      });

      // Non-PDF
      const formTxt = new FormData();
      formTxt.append('resume', new Blob(['plain text'], { type: 'text/plain' }), 'resume.txt');
      formTxt.append('role', 'Frontend Developer');
      const resTxt = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { Cookie: user1Cookie },
        body: formTxt,
      });

      // Missing role
      const formNoRole = new FormData();
      formNoRole.append('resume', new Blob([developerPdfContent], { type: 'application/pdf' }), 'resume.pdf');
      const resNoRole = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { Cookie: user1Cookie },
        body: formNoRole,
      });

      const pass = resMissing.status === 400 && resTxt.status === 400 && resNoRole.status === 400;
      testResults.push({
        name: 'Input validation on protected upload (Missing file, .txt, missing role -> 400)',
        pass,
        detail: `MissingFile: ${resMissing.status}, Txt: ${resTxt.status}, MissingRole: ${resNoRole.status}`,
      });
    }

    // 9. Valid PDF analysis with Groq AI + MongoDB persistence for User 1
    let user1AnalysisId = null;
    {
      const form = new FormData();
      form.append('resume', new Blob([developerPdfContent], { type: 'application/pdf' }), 'jane_developer_resume.pdf');
      form.append('role', 'Full-stack Developer');

      const res = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { Cookie: user1Cookie },
        body: form,
      });
      const body = await res.json();
      user1AnalysisId = body.id || body.analysisId;

      const pass =
        res.status === 200 &&
        body.success === true &&
        typeof user1AnalysisId === 'string' &&
        user1AnalysisId.length === 24 &&
        typeof body.score === 'number' &&
        body.score >= 0 &&
        Array.isArray(body.skillsFound) &&
        Array.isArray(body.suggestions);

      testResults.push({
        name: 'Groq AI analysis + MongoDB persistence linked to User 1 (200 + ObjectId)',
        pass,
        detail: `Status: ${res.status}, Saved Analysis ID: ${user1AnalysisId}, Score: ${body.score}/100`,
      });
    }

    // 10. User 1 retrieves their personal analyses list (GET /api/analyses)
    {
      const res = await fetch(`${BASE_URL}/api/analyses`, {
        headers: { Cookie: user1Cookie },
      });
      const body = await res.json();
      const pass =
        res.status === 200 &&
        body.success === true &&
        Array.isArray(body.analyses) &&
        body.analyses.some((a) => a.id === user1AnalysisId);

      testResults.push({
        name: 'User 1 personal analysis history (GET /api/analyses -> includes user analysis)',
        pass,
        detail: `Status: ${res.status}, Count: ${body.count}, Contains Analysis: ${body.analyses?.some((a) => a.id === user1AnalysisId)}`,
      });
    }

    // 11. User 1 retrieves single analysis by ID (GET /api/analyses/:id)
    {
      const res = await fetch(`${BASE_URL}/api/analyses/${user1AnalysisId}`, {
        headers: { Cookie: user1Cookie },
      });
      const body = await res.json();
      const pass = res.status === 200 && body.success === true && body.analysis?.id === user1AnalysisId;

      testResults.push({
        name: 'User 1 retrieves specific analysis by ID (GET /api/analyses/:id -> 200)',
        pass,
        detail: `Status: ${res.status}, ID: ${body.analysis?.id}`,
      });
    }

    // 12. Cross-User Data Isolation: Register User 2 and verify User 2 cannot access User 1 data
    const user2Email = `other_user_${Date.now()}@example.com`;
    let user2Cookie = null;
    {
      // Register User 2
      const resReg = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Bob Candidate',
          email: user2Email,
          password: 'Password456!',
        }),
      });
      user2Cookie = extractCookie(resReg);

      // User 2 lists analyses: should be 0 (User 1's analysis must NOT appear)
      const resList2 = await fetch(`${BASE_URL}/api/analyses`, {
        headers: { Cookie: user2Cookie },
      });
      const bodyList2 = await resList2.json();

      // User 2 tries to access User 1's analysis by ID directly: must return 404 (ownership filter)
      const resSteal = await fetch(`${BASE_URL}/api/analyses/${user1AnalysisId}`, {
        headers: { Cookie: user2Cookie },
      });

      const pass =
        resList2.status === 200 &&
        bodyList2.analyses?.every((a) => a.id !== user1AnalysisId) &&
        resSteal.status === 404;

      testResults.push({
        name: 'Cross-user isolation: User 2 cannot see or access User 1 analyses (404 on cross-lookup)',
        pass,
        detail: `User2 Analyses Count: ${bodyList2.count}, Direct Access Attempt Status: ${resSteal.status}`,
      });
    }

    // 13. Logout endpoint clears cookie
    {
      const resLogout = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { Cookie: user2Cookie },
      });
      const logoutBody = await resLogout.json();
      const clearCookieHeader = resLogout.headers.get('set-cookie');

      // Subsequent /api/auth/me without cookies must fail (401)
      const resCheck = await fetch(`${BASE_URL}/api/auth/me`);

      const pass =
        resLogout.status === 200 &&
        logoutBody.success === true &&
        Boolean(clearCookieHeader) &&
        resCheck.status === 401;

      testResults.push({
        name: 'Logout endpoint clears cookie and invalidates session (200 -> 401)',
        pass,
        detail: `Logout Status: ${resLogout.status}, Follow-up /me Status: ${resCheck.status}`,
      });
    }

    console.log('--- TEST RUN RESULTS ---');
    let allPassed = true;
    for (const [idx, t] of testResults.entries()) {
      const mark = t.pass ? 'PASS' : 'FAIL';
      if (!t.pass) allPassed = false;
      console.log(`[${idx + 1}] [${mark}] ${t.name}`);
      console.log(`    Detail: ${t.detail}`);
    }

    console.log(`\nOVERALL: ${allPassed ? 'ALL BACKEND TESTS PASSED' : 'SOME TESTS FAILED'}`);
  } finally {
    console.log('\nShutting down backend server...');
    serverProcess.kill('SIGTERM');
  }
}

runAllChecks();
