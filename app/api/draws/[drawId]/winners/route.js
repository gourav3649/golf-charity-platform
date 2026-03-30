import connectDB from '@/lib/mongodb';
import Draw from '@/models/Draw';
import User from '@/models/User';
import { withAuth, withAdmin, errorResponse, jsonResponse } from '@/middleware/authMiddleware';
import mongoose from 'mongoose';

/**
 * GET /api/draws/[drawId]/winners
 * Get all winners for a draw (public for users to see results, admin for review)
 */
async function handleGET(request, context) {
  try {
    await connectDB();

    const { drawId } = context.params;

    if (!drawId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse('Invalid draw ID', 400);
    }

    // Fetch draw
    const draw = await Draw.findById(drawId);
    if (!draw) {
      return errorResponse('Draw not found', 404);
    }

    // Enrich winners with user details
    const enrichedWinners = await Promise.all(
      draw.winners.map(async (winner) => {
        const user = await User.findById(winner.userId).select('email');
        return {
          winnerId: winner._id,
          userId: winner.userId,
          email: user?.email || 'Unknown',
          matchType: winner.matchType,
          matchCount: winner.matchType === '5' ? 5 : winner.matchType === '4' ? 4 : 3,
          prizeAmount: parseFloat(winner.prizeAmount.toFixed(2)),
          verificationStatus: winner.verificationStatus,
          proofImageUrl: winner.proofImageUrl || null,
          proofSubmittedAt: winner.proofSubmittedAt || null,
          verifiedAt: winner.verifiedAt || null,
          verificationNote: winner.verificationNote || null,
          paidAt: winner.paidAt || null,
          paidAmount: winner.paidAmount || null,
        };
      })
    );

    // Group winners by status
    const winnersByStatus = {
      pending: enrichedWinners.filter(w => w.verificationStatus === 'pending'),
      approved: enrichedWinners.filter(w => w.verificationStatus === 'approved'),
      rejected: enrichedWinners.filter(w => w.verificationStatus === 'rejected'),
      paid: enrichedWinners.filter(w => w.verificationStatus === 'paid'),
    };

    return jsonResponse(
      {
        success: true,
        data: {
          drawId: draw._id,
          month: draw.month,
          status: draw.status,
          drawnNumbers: draw.drawnNumbers,
          totalWinners: enrichedWinners.length,
          winnersSummary: {
            pending: winnersByStatus.pending.length,
            approved: winnersByStatus.approved.length,
            rejected: winnersByStatus.rejected.length,
            paid: winnersByStatus.paid.length,
          },
          winnersByStatus,
          allWinners: enrichedWinners.sort((a, b) => {
            // Sort by status (pending first), then by match type
            const statusOrder = { pending: 0, approved: 1, rejected: 2, paid: 3 };
            if (statusOrder[a.verificationStatus] !== statusOrder[b.verificationStatus]) {
              return statusOrder[a.verificationStatus] - statusOrder[b.verificationStatus];
            }
            return parseInt(b.matchType) - parseInt(a.matchType);
          }),
        },
      },
      200
    );
  } catch (error) {
    console.error('Get draw winners error:', error);
    return errorResponse(
      error.message || 'Error fetching winners',
      500,
      { error: error.message }
    );
  }
}

/**
 * POST /api/draws/[drawId]/winners/verify
 * User uploads proof of winning score (scorecard image)
 * Body: { winnerId, proofImageUrl }
 */
async function handlePostWithAuth(request, context) {
  try {
    await connectDB();

    const { drawId } = context.params;
    const { winnerId, proofImageUrl } = await request.json();

    if (!drawId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse('Invalid draw ID', 400);
    }

    if (!winnerId || !winnerId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse('Invalid winner ID', 400);
    }

    if (!proofImageUrl || typeof proofImageUrl !== 'string') {
      return errorResponse('Proof image URL is required and must be a string', 400);
    }

    // Validate URL format (basic check)
    if (!proofImageUrl.startsWith('http')) {
      return errorResponse('Proof image URL must be a valid HTTP(S) URL', 400);
    }

    // Fetch draw
    const draw = await Draw.findById(drawId);
    if (!draw) {
      return errorResponse('Draw not found', 404);
    }

    // Find winner
    const winnerIndex = draw.winners.findIndex(w => w._id.toString() === winnerId);
    if (winnerIndex === -1) {
      return errorResponse('Winner not found', 404);
    }

    const winner = draw.winners[winnerIndex];

    // Check if winner is the authenticated user
    // The user ID is attached to request by authMiddleware
    const userId = request.user.userId.toString();
    if (winner.userId.toString() !== userId) {
      return errorResponse('You can only upload proof for your own winning ticket', 403);
    }

    // Check if already verified or paid
    if (['approved', 'rejected', 'paid'].includes(winner.verificationStatus)) {
      return errorResponse(
        `Cannot modify proof for ${winner.verificationStatus} winner`,
        400
      );
    }

    // Update winner with proof
    winner.proofImageUrl = proofImageUrl;
    winner.proofSubmittedAt = new Date();
    winner.verificationStatus = 'pending'; // Reset to pending if updating

    // Save draw
    await draw.save();

    return jsonResponse(
      {
        success: true,
        message: 'Proof submitted successfully. Admin will review shortly.',
        data: {
          winnerId: winner._id,
          verificationStatus: winner.verificationStatus,
          proofSubmittedAt: winner.proofSubmittedAt,
          matchType: winner.matchType,
          prizeAmount: parseFloat(winner.prizeAmount.toFixed(2)),
          expectedTimeframe: '24-48 hours',
        },
      },
      200
    );
  } catch (error) {
    console.error('Submit proof error:', error);
    return errorResponse(
      error.message || 'Error submitting proof',
      500,
      { error: error.message }
    );
  }
}

const handlePOST = withAuth(handlePostWithAuth);

export const GET = handleGET;
export const POST = handlePOST;
