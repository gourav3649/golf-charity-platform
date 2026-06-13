import { verifyAccessToken, getAuthToken } from '@/lib/jwt';

/**
 * Auth middleware for Next.js API routes
 * Verifies JWT token from httpOnly cookies
 * Attaches user data to request
 */
export async function authMiddleware(request) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No authentication token provided',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid or expired authentication token',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Attach user to request for use in handler
    request.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    return null; // Return null means no error, middleware passed
  } catch (error) {
    console.error('Auth middleware error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Authentication error',
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Admin-only middleware
 * Call this after authMiddleware to check if user is admin
 */
export function adminMiddleware(request) {
  if (!request.user) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Authentication required',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (request.user.role !== 'admin') {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Admin access required',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return null; // Middleware passed
}

/**
 * Wrapper function to apply auth middleware to API handlers
 * Usage: export const GET = withAuth(handler);
 */
export function withAuth(handler) {
  return async (request, context) => {
    const error = await authMiddleware(request);
    if (error) return error;
    return handler(request, context);
  };
}

/**
 * Wrapper function to apply admin middleware to API handlers
 * Usage: export const POST = withAdmin(handler);
 */
export function withAdmin(handler) {
  return async (request, context) => {
    const authError = await authMiddleware(request);
    if (authError) return authError;

    const adminError = adminMiddleware(request);
    if (adminError) return adminError;

    return handler(request, context);
  };
}

/**
 * API response helper
 */
export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Error response helper
 */
export function errorResponse(message, status = 400, additionalData = {}) {
  return jsonResponse(
    {
      success: false,
      message,
      ...additionalData,
    },
    status
  );
}

/**
 * Success response helper
 */
export function successResponse(data, message = 'Success', status = 200) {
  return jsonResponse(
    {
      success: true,
      message,
      data,
    },
    status
  );
}
