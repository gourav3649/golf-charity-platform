import connectDB from '@/lib/mongodb';
import GolfScore from '@/models/GolfScore';
import User from '@/models/User';
import { withAuth, errorResponse, jsonResponse } from '@/middleware/authMiddleware';

/**
 * GET /api/scores
 * Fetch user's golf scores (max 5)
 * Protected route
 */
async function handleGET(request, context) {
  try {
    await connectDB();

    const userId = request.user.userId;

    // Find user's golf scores
    const golfScores = await GolfScore.findOne({ userId });

    if (!golfScores) {
      return jsonResponse(
        {
          success: true,
          message: 'No scores found',
          data: {
            scores: [],
            totalScores: 0,
            averageScore: 0,
          },
        },
        200
      );
    }

    return jsonResponse(
      {
        success: true,
        message: 'Scores retrieved successfully',
        data: {
          scores: golfScores.getScoresSorted(),
          totalScores: golfScores.scores.length,
          averageScore: parseFloat(golfScores.averageScore),
        },
      },
      200
    );
  } catch (error) {
    console.error('Get scores error:', error);
    return errorResponse(
      error.message || 'Error fetching scores',
      500,
      { error: error.message }
    );
  }
}

/**
 * POST /api/scores
 * Add a new golf score
 * Protected route
 * Body: { value: number (1-45), date: ISO date string }
 */
async function handlePOST(request, context) {
  try {
    await connectDB();

    const userId = request.user.userId;
    const { value, date } = await request.json();

    // Validation
    if (value === undefined || value === null || date === undefined) {
      return errorResponse('Score value and date are required', 400);
    }

    // Validate score range (Stableford format: 1-45)
    if (!Number.isInteger(value) || value < 1 || value > 45) {
      return errorResponse('Score must be an integer between 1 and 45 (Stableford format)', 400);
    }

    // Validate date
    const scoreDate = new Date(date);
    if (isNaN(scoreDate.getTime())) {
      return errorResponse('Invalid date format', 400);
    }

    // Check date is not in the future
    if (scoreDate > new Date()) {
      return errorResponse('Score date cannot be in the future', 400);
    }

    // Find or create golf score document
    let golfScores = await GolfScore.findOne({ userId });

    if (!golfScores) {
      golfScores = new GolfScore({
        userId,
        scores: [],
      });
    }

    // Add new score (auto-removes oldest if > 5)
    golfScores.addScore(value, scoreDate);

    // Save
    await golfScores.save();

    return jsonResponse(
      {
        success: true,
        message: 'Score added successfully',
        data: {
          scores: golfScores.getScoresSorted(),
          totalScores: golfScores.scores.length,
          averageScore: parseFloat(golfScores.averageScore),
        },
      },
      201
    );
  } catch (error) {
    console.error('Add score error:', error);
    return errorResponse(
      error.message || 'Error adding score',
      500,
      { error: error.message }
    );
  }
}

// Wrap handlers with auth middleware
export const GET = withAuth(handleGET);
export const POST = withAuth(handlePOST);
