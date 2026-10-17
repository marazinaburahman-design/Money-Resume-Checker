import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { PDFParse } from 'pdf-parse';
import { connectDB } from './config/db.js';
import { ResumeAnalysis } from './models/ResumeAnalysis.js';
import { analyzeResumeWithGroq } from './services/groqService.js';
import { requireAuth } from './middleware/auth.js';
import authRoutes from './routes/authRoutes.js';

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
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Authentication API Routes
app.use('/api/auth', authRoutes);

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

// PDF Resume Upload & AI Analysis Endpoint (Protected)
app.post('/api/analyze', requireAuth, handleResumeUpload, async (req, res) => {
  try {
    const trimmedRole = typeof req.body.role === 'string' ? req.body.role.trim() : '';
    const role = trimmedRole;

    // 1. Validate file presence
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No resume file was uploaded. Please attach a PDF document using field "resume".',
      });
    }

    // 2. Validate target role
    if (!trimmedRole || !VALID_ROLES.includes(trimmedRole)) {
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

    console.log(`[API /api/analyze] Role: ${role} | Returning Score: ${analysis.score}`);

    // 8. Persist verified AI assessment to MongoDB referencing owner
    let savedDoc;
    try {
      savedDoc = await ResumeAnalysis.create({
        userId: req.user._id,
        jobRole: role,
        score: analysis.score,
        skillsFound: analysis.skillsFound,
        skillsMissing: analysis.skillsMissing,
        suggestions: analysis.suggestions,
        summary: analysis.summary,
        originalFilename: req.file.originalname || 'resume.pdf',
        fileName: req.file.originalname || 'resume.pdf',
        createdAt: new Date(),
      });
      console.log(`[MongoDB] Successfully persisted analysis with ID: ${savedDoc._id} for user: ${req.user._id}`);
    } catch (dbErr) {
      console.error('[MongoDB Save Error]', dbErr.message);
      return res.status(500).json({
        success: false,
        error: 'Database error: Failed to save resume analysis to MongoDB.',
      });
    }

    // 9. Return verified AI assessment with saved analysis ID
    return res.status(200).json({
      success: true,
      id: savedDoc._id.toString(),
      analysisId: savedDoc._id.toString(),
      role,
      jobRole: role,
      score: analysis.score,
      summary: analysis.summary,
      skillsFound: analysis.skillsFound,
      skillsMissing: analysis.skillsMissing,
      suggestions: analysis.suggestions,
      originalFilename: savedDoc.originalFilename,
      createdAt: savedDoc.createdAt,
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

// GET /api/analyses - Retrieve saved analyses for the authenticated user only (newest first)
app.get('/api/analyses', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 50), 100);
    const analyses = await ResumeAnalysis.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const formatted = analyses.map((doc) => ({
      id: doc._id.toString(),
      jobRole: doc.jobRole,
      score: doc.score,
      skillsFound: doc.skillsFound || [],
      skillsMissing: doc.skillsMissing || [],
      suggestions: doc.suggestions || [],
      summary: doc.summary || '',
      originalFilename: doc.originalFilename || doc.fileName || '',
      createdAt: doc.createdAt,
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      analyses: formatted,
    });
  } catch (err) {
    console.error('[GET /api/analyses Error]', err.message);
    return res.status(500).json({
      success: false,
      error: 'Database error: Failed to retrieve saved analyses.',
    });
  }
});

// GET /api/analyses/:id - Retrieve a single analysis with validated ID and ownership filter
app.get('/api/analyses/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid analysis ID format. Expected a 24-character hexadecimal ObjectId.',
      });
    }

    // Ownership-filtered lookup: users can only fetch their own analyses
    const doc = await ResumeAnalysis.findOne({ _id: id, userId: req.user._id }).lean();

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: `No resume analysis found with ID "${id}".`,
      });
    }

    return res.status(200).json({
      success: true,
      analysis: {
        id: doc._id.toString(),
        jobRole: doc.jobRole,
        score: doc.score,
        skillsFound: doc.skillsFound || [],
        skillsMissing: doc.skillsMissing || [],
        suggestions: doc.suggestions || [],
        summary: doc.summary || '',
        originalFilename: doc.originalFilename || doc.fileName || '',
        createdAt: doc.createdAt,
      },
    });
  } catch (err) {
    console.error('[GET /api/analyses/:id Error]', err.message);
    return res.status(500).json({
      success: false,
      error: 'Database error: Failed to retrieve analysis.',
    });
  }
});

// Connect to MongoDB and start HTTP listener
async function startServer() {
  try {
    await connectDB();
  } catch (dbErr) {
    console.error(`[Server Startup Warning] Starting without active DB: ${dbErr.message}`);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
