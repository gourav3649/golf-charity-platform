import connectDB from '@/lib/mongodb';
import Draw from '@/models/Draw';
import { withAdmin, errorResponse, jsonResponse } from '@/middleware/authMiddleware';

/**
 * POST /api/draws/publish
 * Publish draw results (admin only)
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

    // Check if draw can be published
    if (!draw.canPublish()) {
      return errorResponse(
        'Draw must be in simulated status and have drawn numbers before publishing',
        400
      );
    }

    // Set published date and status
    draw.publishedAt = new Date();
    draw.status = 'published';

    // Save draw
    await draw.save();

    // Prepare response
    const winnersByType = {
      '5': draw.winners.filter(w => w.matchType === '5').length,
      '4': draw.winners.filter(w => w.matchType === '4').length,
      '3': draw.winners.filter(w => w.matchType === '3').length,
    };

    return jsonResponse(
      {
        success: true,
        message: `Draw for ${draw.month} published successfully`,
        data: {
          draw: {
            id: draw._id,
            month: draw.month,
            status: draw.status,
            drawnNumbers: draw.drawnNumbers,
            publishedAt: draw.publishedAt,
            totalWinners: draw.winners.length,
            winnersByMatchType: winnersByType,
            prizeDistribution: {
              fiveMatch: {
                amount: parseFloat(draw.prizePool.fiveMatch.amount.toFixed(2)),
                winners: winnersByType['5'],
              },
              fourMatch: {
                amount: parseFloat(draw.prizePool.fourMatch.amount.toFixed(2)),
                winners: winnersByType['4'],
              },
              threeMatch: {
                amount: parseFloat(draw.prizePool.threeMatch.amount.toFixed(2)),
                winners: winnersByType['3'],
              },
            },
            rolloverAmount: draw.rolloverAmount > 0 ? parseFloat(draw.rolloverAmount.toFixed(2)) : 0,
            rolloverMessage: draw.rolloverAmount > 0 ? `No 5-match winner. Jackpot of $${draw.rolloverAmount.toFixed(2)} rolls over to next month.` : null,
            message: 'Draw results are now live. Winners can upload proof and track payments.',
          },
        },
      },
      200
    );
  } catch (error) {
    console.error('Publish draw error:', error);
    return errorResponse(
      error.message || 'Error publishing draw',
      500,
      { error: error.message }
    );
  }
}

export const POST = withAdmin(handlePOST);
