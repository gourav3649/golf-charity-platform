import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import GolfScore from '@/models/GolfScore';
import Charity from '@/models/Charity';
import { withAuth, errorResponse, jsonResponse } from '@/middleware/authMiddleware';

/**
 * GET /api/auth/me
 * Get current authenticated user's profile
 * Requires: Valid JWT in httpOnly cookie
 */
async function handler(request, context) {
  try {
    await connectDB();

    const userId = request.user.userId;

    // Fetch user
    const user = await User.findById(userId)
      .populate('selectedCharityId', 'name description imageUrl');

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Fetch user's golf scores
    const golfScores = await GolfScore.findOne({ userId });

    // Prepare response
    const userResponse = user.toJSON();

    return jsonResponse(
      {
        success: true,
        message: 'User profile retrieved',
        data: {
          user: userResponse,
          scores: golfScores ? golfScores.getScoresSorted() : [],
          averageScore: golfScores ? golfScores.averageScore : 0,
        },
      },
      200
    );
  } catch (error) {
    console.error('Get current user error:', error);
    return errorResponse(
      error.message || 'Error fetching user profile',
      500,
      { error: error.message }
    );
  }
}

/**
 * Wrap handler with auth middleware
 */
export const GET = withAuth(handler);
