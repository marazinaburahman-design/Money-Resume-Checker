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

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(maxAttempts = 20) {
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

  serverProcess.stdout.on('data', (d) => {
    // console.log(`[SERVER] ${d.toString().trim()}`);
  });
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

    // 1. Health endpoint
    {
      const res = await fetch(`${BASE_URL}/api/health`);
      const body = await res.json();
      const pass = res.status === 200 && body.status === 'ok';
      testResults.push({ name: 'Health check (GET /api/health)', pass, detail: `Status: ${res.status}, body: ${JSON.stringify(body)}` });
    }

    // 2. Missing file rejection
    {
      const form = new FormData();
      form.append('role', 'Frontend Developer');
      const res = await fetch(`${BASE_URL}/api/analyze`, { method: 'POST', body: form });
      const body = await res.json();
      const pass = res.status === 400 && body.success === false && body.error.includes('No resume file was uploaded');
      testResults.push({ name: 'Missing file rejection (400)', pass, detail: `Status: ${res.status}, error: "${body.error}"` });
    }

    // 3. Non-PDF file type rejection (Multer fileFilter)
    {
      const form = new FormData();
      const blob = new Blob(['Not a PDF file.'], { type: 'text/plain' });
      form.append('resume', blob, 'notes.txt');
      form.append('role', 'Frontend Developer');
      const res = await fetch(`${BASE_URL}/api/analyze`, { method: 'POST', body: form });
      const body = await res.json();
      const pass = res.status === 400 && body.success === false && body.error.includes('Only PDF files are supported');
      testResults.push({ name: 'Non-PDF file rejection (.txt -> 400)', pass, detail: `Status: ${res.status}, error: "${body.error}"` });
    }

    // 4. Spoofed PDF rejection (missing %PDF- header)
    {
      const form = new FormData();
      const blob = new Blob(['Fake PDF content starting without magic bytes'], { type: 'application/pdf' });
      form.append('resume', blob, 'fake.pdf');
      form.append('role', 'Frontend Developer');
      const res = await fetch(`${BASE_URL}/api/analyze`, { method: 'POST', body: form });
      const body = await res.json();
      const pass = res.status === 400 && body.success === false && body.error.includes('%PDF-');
      testResults.push({ name: 'Spoofed PDF header rejection (%PDF- check -> 400)', pass, detail: `Status: ${res.status}, error: "${body.error}"` });
    }

    // 5. Oversized file rejection (> 4 MB -> HTTP 413 Payload Too Large)
    {
      const form = new FormData();
      const bigBuffer = Buffer.alloc(4.2 * 1024 * 1024, 0x25);
      bigBuffer.write('%PDF-1.4\n');
      const blob = new Blob([bigBuffer], { type: 'application/pdf' });
      form.append('resume', blob, 'huge.pdf');
      form.append('role', 'Full-stack Developer');
      const res = await fetch(`${BASE_URL}/api/analyze`, { method: 'POST', body: form });
      const body = await res.json();
      const pass = (res.status === 413 || res.status === 400) && body.success === false && (body.error.includes('4 MB') || body.error.includes('too large'));
      testResults.push({ name: 'Oversized file rejection (>4 MB -> 413/400)', pass, detail: `Status: ${res.status}, error: "${body.error}"` });
    }

    // 6. Missing job role validation
    {
      const form = new FormData();
      const blob = new Blob([developerPdfContent], { type: 'application/pdf' });
      form.append('resume', blob, 'resume.pdf');
      // No role field
      const res = await fetch(`${BASE_URL}/api/analyze`, { method: 'POST', body: form });
      const body = await res.json();
      const pass = res.status === 400 && body.success === false && body.error.includes('valid developer target role');
      testResults.push({ name: 'Missing job role rejection (400)', pass, detail: `Status: ${res.status}, error: "${body.error}"` });
    }

    // 7. Invalid job role validation
    {
      const form = new FormData();
      const blob = new Blob([developerPdfContent], { type: 'application/pdf' });
      form.append('resume', blob, 'resume.pdf');
      form.append('role', 'Marketing Specialist');
      const res = await fetch(`${BASE_URL}/api/analyze`, { method: 'POST', body: form });
      const body = await res.json();
      const pass = res.status === 400 && body.success === false && body.error.includes('valid developer target role');
      testResults.push({ name: 'Invalid job role rejection (400)', pass, detail: `Status: ${res.status}, error: "${body.error}"` });
    }

    // 8. PDF without extractable text rejection (422)
    {
      const form = new FormData();
      const blob = new Blob([emptyPdfContent], { type: 'application/pdf' });
      form.append('resume', blob, 'scanned_empty.pdf');
      form.append('role', 'Backend Developer');
      const res = await fetch(`${BASE_URL}/api/analyze`, { method: 'POST', body: form });
      const body = await res.json();
      const pass = res.status === 422 && body.success === false && body.error.includes('No readable text could be extracted');
      testResults.push({ name: 'Unextractable/Scanned PDF rejection (422)', pass, detail: `Status: ${res.status}, error: "${body.error}"` });
    }

    // 9. Valid PDF upload with Groq AI analysis
    {
      const form = new FormData();
      const blob = new Blob([developerPdfContent], { type: 'application/pdf' });
      form.append('resume', blob, 'developer_resume.pdf');
      form.append('role', 'Full-stack Developer');
      const res = await fetch(`${BASE_URL}/api/analyze`, { method: 'POST', body: form });
      const body = await res.json();

      const pass =
        res.status === 200 &&
        body.success === true &&
        body.role === 'Full-stack Developer' &&
        typeof body.score === 'number' &&
        body.score >= 0 &&
        body.score <= 100 &&
        typeof body.summary === 'string' &&
        body.summary.length > 0 &&
        Array.isArray(body.skillsFound) &&
        Array.isArray(body.skillsMissing) &&
        Array.isArray(body.suggestions) &&
        body.suggestions.length === 3 &&
        typeof body.meta?.model === 'string';

      testResults.push({
        name: 'Valid PDF Analysis via Groq AI (200 + Structured Output)',
        pass,
        detail: `Status: ${res.status}, Score: ${body.score}/100, Model: ${body.meta?.model}, SkillsFound: ${body.skillsFound?.length}, SkillsMissing: ${body.skillsMissing?.length}, Suggestions: ${body.suggestions?.length}`,
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
