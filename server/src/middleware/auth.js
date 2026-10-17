import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const COOKIE_NAME = 'token';

/**
 * Cookie configuration options for HTTP-only JWT storage.
 * In production: secure = true, sameSite = 'none' (or 'lax' depending on domain).
 * In development: secure = false, sameSite = 'lax'.
 */
export const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
};

/**
 * Signs a JWT with the user's ID and sets the expiration.
 */
export const signToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'fallback_dev_secret_never_use_in_prod';
  return jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
};

/**
 * Express middleware to authenticate requests via HTTP-only cookie (or Bearer header).
 */
export async function requireAuth(req, res, next) {
  try {
    // 1. Extract token from HTTP-only cookie or Authorization header fallback
    let token = req.cookies?.[COOKIE_NAME];

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in to continue.',
      });
    }

    // 2. Verify token
    const secret = process.env.JWT_SECRET || 'fallback_dev_secret_never_use_in_prod';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Session expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token. Please log in again.',
      });
    }

    // 3. Find user in database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account not found. Please log in again.',
      });
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware Error]', err.message);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred during authentication.',
    });
  }
}
