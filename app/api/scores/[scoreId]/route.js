import connectDB from '@/lib/mongodb';
import GolfScore from '@/models/GolfScore';
import { withAuth, errorResponse, jsonResponse } from '@/middleware/authMiddleware';

/**
 * PUT /api/scores/[scoreId]
 * Update a specific golf score
 * Protected route
 * Body: { value: number (1-45), date: ISO date string }
 */
async function handlePUT(request, context) {
  try {
    await connectDB();

    const userId = request.user.userId;
    const { scoreId } = context.params;
    const { value, date } = await request.json();

    // Validation
    if (value === undefined || value === null) {
      return errorResponse('Score value is required', 400);
    }

    if (!Number.isInteger(value) || value < 1 || value > 45) {
      return errorResponse('Score must be an integer between 1 and 45', 400);
    }

    // Find user's golf scores
    const golfScores = await GolfScore.findOne({ userId });

    if (!golfScores) {
      return errorResponse('Golf scores not found', 404);
    }

    // Find the specific score to update
    const scoreToUpdate = golfScores.scores.find(
      s => s._id.toString() === scoreId
    );

    if (!scoreToUpdate) {
      return errorResponse('Score not found', 404);
    }

    // Update score value
    scoreToUpdate.value = value;

    // Update date if provided
    if (date) {
      const scoreDate = new Date(date);
      if (isNaN(scoreDate.getTime())) {
        return errorResponse('Invalid date format', 400);
      }

      if (scoreDate > new Date()) {
        return errorResponse('Score date cannot be in the future', 400);
      }

      scoreToUpdate.date = scoreDate;
    }

    // Save changes
    await golfScores.save();

    return jsonResponse(
      {
        success: true,
        message: 'Score updated successfully',
        data: {
          scores: golfScores.getScoresSorted(),
          totalScores: golfScores.scores.length,
          averageScore: parseFloat(golfScores.averageScore),
        },
      },
      200
    );
  } catch (error) {
    console.error('Update score error:', error);
    return errorResponse(
      error.message || 'Error updating score',
      500,
      { error: error.message }
    );
  }
}

/**
 * DELETE /api/scores/[scoreId]
 * Delete a specific golf score
 * Protected route
 */
async function handleDELETE(request, context) {
  try {
    await connectDB();

    const userId = request.user.userId;
    const { scoreId } = context.params;

    // Find user's golf scores
    const golfScores = await GolfScore.findOne({ userId });

    if (!golfScores) {
      return errorResponse('Golf scores not found', 404);
    }

    // Find and remove the specific score
    const initialLength = golfScores.scores.length;
    golfScores.scores = golfScores.scores.filter(
      s => s._id.toString() !== scoreId
    );

    // Check if score was found and deleted
    if (golfScores.scores.length === initialLength) {
      return errorResponse('Score not found', 404);
    }

    // Save changes
    await golfScores.save();

    return jsonResponse(
      {
        success: true,
        message: 'Score deleted successfully',
        data: {
          scores: golfScores.getScoresSorted(),
          totalScores: golfScores.scores.length,
          averageScore: golfScores.scores.length > 0 ? parseFloat(golfScores.averageScore) : 0,
        },
      },
      200
    );
  } catch (error) {
    console.error('Delete score error:', error);
    return errorResponse(
      error.message || 'Error deleting score',
      500,
      { error: error.message }
    );
  }
}

// Wrap handlers with auth middleware
export const PUT = withAuth(handlePUT);
export const DELETE = withAuth(handleDELETE);
