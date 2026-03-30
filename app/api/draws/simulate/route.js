import connectDB from '@/lib/mongodb';
import Draw from '@/models/Draw';
import User from '@/models/User';
import GolfScore from '@/models/GolfScore';
import { withAdmin, errorResponse, jsonResponse } from '@/middleware/authMiddleware';

/**
 * Helper function to count matching numbers between user scores and drawn numbers
 */
function countMatches(userScores, drawnNumbers) {
  const userScoresSet = new Set(userScores.map(s => s.value));
  const matches = drawnNumbers.filter(num => userScoresSet.has(num));
  return {
    count: matches.length,
    matchedNumbers: matches.sort((a, b) => a - b),
  };
}

/**
 * POST /api/draws/simulate
 * Simulate draw: process all active subscribers' scores against drawn numbers
 * Admin only
 * Body: { drawId }
 */
async function handlePOST(request, context) {
  try {
    await connectDB();

    const { drawId } = await request.json();

    if (!drawId) {
      return errorResponse('Draw ID is required', 400);
    }

    // Validate draw ID format
    if (!drawId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse('Invalid draw ID', 400);
    }

    // Fetch draw
    const draw = await Draw.findById(drawId);
    if (!draw) {
      return errorResponse('Draw not found', 404);
    }

    // Check draw status
    if (draw.status === 'published') {
      return errorResponse('Cannot simulate a published draw', 400);
    }

    if (draw.drawnNumbers.length !== 5) {
      return errorResponse('Draw must have exactly 5 drawn numbers before simulation', 400);
    }

    // Fetch all active subscribers
    const activeSubscribers = await User.find({
      'subscription.status': 'active',
    }).select('_id email firstName lastName');

    let totalPlayers = activeSubscribers.length;
    const winners = [];
    const estimatedPrizePool = totalPlayers * 9.99; // Rough estimate (mix of monthly/yearly)

    // Process each subscriber
    for (const user of activeSubscribers) {
      // Fetch user's golf scores
      const golfScore = await GolfScore.findOne({ userId: user._id });

      if (!golfScore || golfScore.scores.length === 0) {
        // Skip users with no scores
        continue;
      }

      // Get user's scores (max 5)
      const userScores = golfScore.getLastScores(5);

      // Count matches
      const { count: matchCount, matchedNumbers } = countMatches(userScores, draw.drawnNumbers);

      // Determine match type and add to winners if 3 or more matches
      if (matchCount >= 3) {
        const matchType = matchCount === 5 ? '5' : matchCount === 4 ? '4' : '3';

        winners.push({
          userId: user._id,
          matchType,
          prizeAmount: 0, // Will be calculated after all winners counted
          winningNumbers: matchedNumbers,
          verificationStatus: 'pending',
          proofUrl: null,
          adminNotes: '',
          verifiedAt: null,
          paidAt: null,
        });
      }
    }

    // Update draw with winners count and participant count
    draw.participantCount = totalPlayers;
    draw.winners = winners;

    // Calculate prize pool (40, 35, 25 split)
    draw.calculatePrizeDistribution(estimatedPrizePool);

    // Distribute prizes to winners by match type
    for (const matchType of ['5', '4', '3']) {
      draw.distributePrizesToWinners(matchType);
    }

    // Set status to simulated
    draw.status = 'simulated';

    // Save draw
    await draw.save();

    // Prepare response statistics
    const winnersByType = {
      '5': winners.filter(w => w.matchType === '5').length,
      '4': winners.filter(w => w.matchType === '4').length,
      '3': winners.filter(w => w.matchType === '3').length,
    };

    return jsonResponse(
      {
        success: true,
        message: 'Draw simulation completed successfully',
        data: {
          draw: {
            id: draw._id,
            month: draw.month,
            status: draw.status,
            drawnNumbers: draw.drawnNumbers,
            participantCount: draw.participantCount,
            totalWinners: winners.length,
            winnersByMatchType: winnersByType,
            estimatedPrizePool: parseFloat(estimatedPrizePool.toFixed(2)),
            prizeDistribution: {
              fiveMatch: {
                share: '40%',
                amount: parseFloat(draw.prizePool.fiveMatch.amount.toFixed(2)),
                winners: winnersByType['5'],
              },
              fourMatch: {
                share: '35%',
                amount: parseFloat(draw.prizePool.fourMatch.amount.toFixed(2)),
                winners: winnersByType['4'],
              },
              threeMatch: {
                share: '25%',
                amount: parseFloat(draw.prizePool.threeMatch.amount.toFixed(2)),
                winners: winnersByType['3'],
              },
            },
            message: 'Review simulation results above. Click Publish to finalize.',
          },
        },
      },
      200
    );
  } catch (error) {
    console.error('Simulate draw error:', error);
    return errorResponse(
      error.message || 'Error simulating draw',
      500,
      { error: error.message }
    );
  }
}

export const POST = withAdmin(handlePOST);
