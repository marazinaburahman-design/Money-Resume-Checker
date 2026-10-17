import express from 'express';
import { User } from '../models/User.js';
import { signToken, getCookieOptions, COOKIE_NAME, requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user with name, unique lowercase email, and hashed password.
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    // 1. Validate inputs
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Name is required and must be at least 2 characters.',
      });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'A valid email address is required.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email format (e.g., student@university.edu).',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.',
      });
    }

    // 2. Check for duplicate email
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please log in instead.',
      });
    }

    // 3. Create user (password is automatically hashed via Mongoose pre-save hook)
    const user = new User({
      name: name.trim(),
      email: cleanEmail,
      password,
    });
    await user.save();

    // 4. Sign JWT token and set HTTP-only cookie
    const token = signToken(user._id);
    res.cookie(COOKIE_NAME, token, getCookieOptions());

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('[Registration Error]', err.message);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred during registration. Please try again.',
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user credentials and return HTTP-only JWT cookie.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.',
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    // 1. Locate user by email
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    // 2. Compare password hash using bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    // 3. Generate JWT and issue cookie
    const token = signToken(user._id);
    res.cookie(COOKIE_NAME, token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('[Login Error]', err.message);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred during login. Please try again.',
    });
  }
});

/**
 * POST /api/auth/logout
 * Clear authentication cookie.
 */
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, getCookieOptions());
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

/**
 * GET /api/auth/me
 * Retrieve the currently authenticated user session.
 */
router.get('/me', requireAuth, (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id.toString(),
      name: req.user.name,
      email: req.user.email,
      createdAt: req.user.createdAt,
    },
  });
});

export default router;
