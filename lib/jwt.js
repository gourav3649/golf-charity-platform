import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';
const JWT_EXPIRATION = '1h';
const JWT_REFRESH_EXPIRATION = '7d';

/**
 * Generate access token (JWT)
 * @param {Object} payload - Data to encode in token
 * @returns {string} - JWT token
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });
}

/**
 * Generate refresh token
 * @param {Object} payload - Data to encode in token
 * @returns {string} - Refresh token
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRATION,
  });
}

/**
 * Verify access token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} - Decoded payload or null if invalid
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Verify refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object|null} - Decoded payload or null if invalid
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Set JWT in httpOnly cookie
 * @param {string} token - Access token
 */
export async function setAuthCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });
}

/**
 * Set refresh token in httpOnly cookie
 * @param {string} token - Refresh token
 */
export async function setRefreshCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set('refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

/**
 * Get auth token from cookies
 * @returns {string|null} - Token or null
 */
export async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value || null;
}

/**
 * Get refresh token from cookies
 * @returns {string|null} - Token or null
 */
export async function getRefreshToken() {
  const cookieStore = await cookies();
  return cookieStore.get('refresh_token')?.value || null;
}

/**
 * Clear auth cookies
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  cookieStore.delete('refresh_token');
}

/**
 * Decode JWT without verification (for extracting claims)
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded payload or null
 */
export function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (err) {
    return null;
  }
}

/**
 * Generate tokens for user
 * @param {Object} user - User object (with _id, email, role)
 * @returns {Object} - { accessToken, refreshToken }
 */
export function generateTokens(user) {
  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user._id.toString(),
  });

  return { accessToken, refreshToken };
}
