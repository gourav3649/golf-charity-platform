import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateTokens, setAuthCookie, setRefreshCookie } from '@/lib/jwt';
import { jsonResponse, errorResponse } from '@/middleware/authMiddleware';

/**
 * POST /api/auth/login
 * Login user with email and password
 * Body: { email, password }
 */
export async function POST(request) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    // Find user (need to select password field explicitly)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );

    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return errorResponse('Invalid email or password', 401);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Set cookies
    await setAuthCookie(accessToken);
    await setRefreshCookie(refreshToken);

    // Prepare user response (exclude password)
    const userResponse = user.toJSON();
    // Ensure role is included in response
    if (!userResponse.role) {
      userResponse.role = user.role;
    }

    return jsonResponse(
      {
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          accessToken,
        },
      },
      200
    );
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(
      error.message || 'Error during login',
      500,
      { error: error.message }
    );
  }
}
