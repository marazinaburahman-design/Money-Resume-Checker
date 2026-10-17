import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import { analyzeResumeWithGroq } from './services/groqService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB
const VALID_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full-stack Developer',
  'AI Engineer',
];

// Configure Multer for strictly in-memory processing
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfExt = file.originalname.toLowerCase().endsWith('.pdf');

    if (!isPdfMime && !isPdfExt) {
      const err = new Error('INVALID_FILE_TYPE');
      err.code = 'INVALID_FILE_TYPE';
      return cb(err);
    }
    cb(null, true);
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'AI Resume Analyzer Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// Custom upload middleware wrapper for granular error handling
const handleResumeUpload = (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            error: 'File exceeds the 4 MB size limit. Please upload a smaller PDF.',
          });
        }
        return res.status(400).json({
          success: false,
          error: `Upload validation error: ${err.message}`,
        });
      }

      if (err.code === 'INVALID_FILE_TYPE' || err.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          error: 'Only PDF files are supported. Please upload a document ending in .pdf.',
        });
      }

      return res.status(400).json({
        success: false,
        error: err.message || 'File upload failed.',
      });
    }
    next();
  });
};

// PDF Resume Upload & AI Analysis Endpoint
app.post('/api/analyze', handleResumeUpload, async (req, res) => {
  try {
    const { role } = req.body;

    // 1. Validate file presence
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No resume file was uploaded. Please attach a PDF document using field "resume".',
      });
    }

    // 2. Validate target role
    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        error:
          'Please select a valid developer target role (Frontend Developer, Backend Developer, Full-stack Developer, or AI Engineer).',
      });
    }

    // 3. Validate buffer integrity and non-zero size
    if (!req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'The uploaded PDF file is empty (0 bytes).',
      });
    }

    // 4. Validate PDF magic bytes (%PDF-) to prevent spoofed file extensions
    const fileHeader = req.file.buffer.subarray(0, 5).toString('ascii');
    if (!fileHeader.startsWith('%PDF-')) {
      return res.status(400).json({
        success: false,
        error: 'The uploaded file is not a valid PDF document (missing %PDF- header).',
      });
    }

    // 5. Extract text strictly in-memory using PDFParse
    let extractedText = '';
    try {
      const parser = new PDFParse({ data: req.file.buffer });
      const result = await parser.getText();

      // Extract raw textual content from pages (ignoring automatic page joiners)
      if (Array.isArray(result?.pages)) {
        extractedText = result.pages
          .map((page) => (page.text || '').trim())
          .filter(Boolean)
          .join('\n\n');
      } else if (typeof result?.text === 'string') {
        extractedText = result.text.trim();
      }
    } catch {
      return res.status(422).json({
        success: false,
        error:
          'Could not read or parse the PDF document. Please verify the file is not corrupted or password-protected.',
      });
    }

    // 6. Check for extractable text (reject scanned/image-only PDFs)
    if (!extractedText || extractedText.length === 0) {
      return res.status(422).json({
        success: false,
        error:
          'No readable text could be extracted from this PDF. Scanned PDFs or image-only resumes are not supported yet. Please upload a PDF with selectable text.',
      });
    }

    // 7. Invoke Groq AI for structured career evaluation
    // Note: Extracted text is NOT permanently stored or logged for privacy and security.
    const analysis = await analyzeResumeWithGroq(extractedText, role);

    // 8. Return verified AI assessment
    return res.status(200).json({
      success: true,
      role,
      score: analysis.score,
      summary: analysis.summary,
      skillsFound: analysis.skillsFound,
      skillsMissing: analysis.skillsMissing,
      suggestions: analysis.suggestions,
      meta: analysis.meta,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error:
        err.message ||
        'An internal server error occurred while processing the resume. Please try again.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
