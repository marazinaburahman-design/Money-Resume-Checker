import fs from 'node:fs';

const BASE_URL = 'http://localhost:4000';

async function runTests() {
  console.log('--- STARTING BACKEND TEST SUITE ---\n');

  // Test 1: Health check
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    console.log(`[TEST 1] GET /api/health -> Status: ${res.status}`);
    console.log('Response:', data);
  } catch (e) {
    console.error('[TEST 1 FAILED]', e);
  }

  // Sample PDF payloads
  const validPdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>/Contents 4 0 R>>endobj
4 0 obj<</Length 55>>stream
BT /F1 12 Tf 100 700 Td (Alex Doe - Full Stack Developer) Tj ET
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
367
%%EOF`;

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

  // Test 2: Non-PDF file (rejected file type)
  try {
    const form = new FormData();
    const blob = new Blob(['Not a PDF, plain text file.'], { type: 'text/plain' });
    form.append('resume', blob, 'notes.txt');
    form.append('role', 'Frontend Developer');

    const res = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      body: form,
    });
    const data = await res.json();
    console.log(`\n[TEST 2] Non-PDF File (.txt) -> Status: ${res.status}`);
    console.log('Response:', data);
  } catch (e) {
    console.error('[TEST 2 FAILED]', e);
  }

  // Test 3: Missing file
  try {
    const form = new FormData();
    form.append('role', 'Backend Developer');

    const res = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      body: form,
    });
    const data = await res.json();
    console.log(`\n[TEST 3] Missing File -> Status: ${res.status}`);
    console.log('Response:', data);
  } catch (e) {
    console.error('[TEST 3 FAILED]', e);
  }

  // Test 4: Oversized file (> 4 MB)
  try {
    const form = new FormData();
    const largeBuffer = Buffer.alloc(4.5 * 1024 * 1024, 0x25); // '%PDF-...'
    largeBuffer.write('%PDF-1.4\n');
    const blob = new Blob([largeBuffer], { type: 'application/pdf' });
    form.append('resume', blob, 'oversized.pdf');
    form.append('role', 'AI Engineer');

    const res = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      body: form,
    });
    const data = await res.json();
    console.log(`\n[TEST 4] Oversized File (4.5 MB) -> Status: ${res.status}`);
    console.log('Response:', data);
  } catch (e) {
    console.error('[TEST 4 FAILED]', e);
  }

  // Test 5: PDF without extractable text
  try {
    const form = new FormData();
    const blob = new Blob([emptyPdfContent], { type: 'application/pdf' });
    form.append('resume', blob, 'scanned_empty.pdf');
    form.append('role', 'Frontend Developer');

    const res = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      body: form,
    });
    const data = await res.json();
    console.log(`\n[TEST 5] PDF without extractable text -> Status: ${res.status}`);
    console.log('Response:', data);
  } catch (e) {
    console.error('[TEST 5 FAILED]', e);
  }

  // Test 6: Valid PDF upload -> Calls Groq AI
  try {
    const form = new FormData();
    const blob = new Blob([validPdfContent], { type: 'application/pdf' });
    form.append('resume', blob, 'valid_resume.pdf');
    form.append('role', 'Full-stack Developer');

    const res = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      body: form,
    });
    const data = await res.json();
    console.log(`\n[TEST 6] Valid PDF (Groq AI Integration) -> Status: ${res.status}`);
    console.log('Response:', data);
  } catch (e) {
    console.error('[TEST 6 FAILED]', e);
  }

  console.log('\n--- TEST SUITE COMPLETE ---');
}

runTests();
