import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import GolfScore from '@/models/GolfScore';
import { generateTokens, setAuthCookie, setRefreshCookie } from '@/lib/jwt';
import { jsonResponse, errorResponse } from '@/middleware/authMiddleware';

/**
 * POST /api/auth/signup
 * Register a new user
 * Body: { email, password, firstName, lastName }
 */
export async function POST(request) {
  try {
    await connectDB();

    const { email, password, firstName, lastName } = await request.json();

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return errorResponse('All fields are required', 400);
    }

    if (password.length < 6) {
      return errorResponse('Password must be at least 6 characters', 400);
    }

    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return errorResponse('Invalid email format', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse('Email already registered', 409);
    }

    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: 'user',
      subscription: {
        status: 'inactive',
        plan: null,
      },
      charityContributionPercent: 10,
    });

    await newUser.save();

    // Create empty golf score document for this user
    const golfScores = new GolfScore({
      userId: newUser._id,
      scores: [],
    });
    await golfScores.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser);

    // Set cookies
    await setAuthCookie(accessToken);
    await setRefreshCookie(refreshToken);

    // Prepare user response (exclude password)
    const userResponse = newUser.toJSON();

    return jsonResponse(
      {
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          accessToken,
        },
      },
      201
    );
  } catch (error) {
    console.error('Signup error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return errorResponse('Email already registered', 409);
    }

    return errorResponse(
      error.message || 'Error during signup',
      500,
      { error: error.message }
    );
  }
}
