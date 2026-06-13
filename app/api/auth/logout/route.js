import { clearAuthCookies } from '@/lib/jwt';
import { jsonResponse } from '@/middleware/authMiddleware';

/**
 * POST /api/auth/logout
 * Logout user by clearing auth cookies
 */
export async function POST(request) {
  try {
    // Clear all auth cookies
    await clearAuthCookies();

    return jsonResponse(
      {
        success: true,
        message: 'Logout successful',
        data: null,
      },
      200
    );
  } catch (error) {
    console.error('Logout error:', error);
    return jsonResponse(
      {
        success: false,
        message: 'Error during logout',
        error: error.message,
      },
      500
    );
  }
}
