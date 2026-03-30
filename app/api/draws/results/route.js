import connectDB from '@/lib/mongodb';
import Draw from '@/models/Draw';
import User from '@/models/User';
import Charity from '@/models/Charity';
import mongoose from 'mongoose';
import { errorResponse, jsonResponse } from '@/middleware/authMiddleware';

/**
 * GET /api/draws/results?month=YYYY-MM
 * Get published draw results (public)
 */
async function handleGET(request) {
  try {
    await connectDB();

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month) {
      return errorResponse('Month parameter is required (format: YYYY-MM)', 400);
    }

    // Validate month format YYYY-MM
    if (!month.match(/^\d{4}-\d{2}$/)) {
      return errorResponse('Invalid month format. Use YYYY-MM', 400);
    }

    // Fetch published draw for month
    const draw = await Draw.findOne({ month, status: 'published' });

    if (!draw) {
      return errorResponse('No published draw found for this month', 404);
    }

    // Enrich winners with user and charity info
    const enrichedWinners = await Promise.all(
      draw.winners.map(async (winner) => {
        const user = await User.findById(winner.userId).select('email');
        const charity = user && user.selectedCharityId
          ? await Charity.findById(user.selectedCharityId).select('name')
          : null;

        return {
          userId: winner.userId,
          matchType: winner.matchType,
          matchCount: winner.matchType === '5' ? 5 : winner.matchType === '4' ? 4 : 3,
          prizeAmount: parseFloat(winner.prizeAmount.toFixed(2)),
          verificationStatus: winner.verificationStatus,
          userEmail: user?.email || 'Anonymous',
          charitySelected: charity?.name || 'Not specified',
          winnerProof: winner.proofImageUrl ? 'Uploaded' : 'Pending',
          verifiedAt: winner.verifiedAt || null,
          paidAt: winner.paidAt || null,
        };
      })
    );

    // Group winners by status for easy viewing
    const winnersByStatus = {
      pending: enrichedWinners.filter(w => w.verificationStatus === 'pending'),
      approved: enrichedWinners.filter(w => w.verificationStatus === 'approved'),
      rejected: enrichedWinners.filter(w => w.verificationStatus === 'rejected'),
      paid: enrichedWinners.filter(w => w.verificationStatus === 'paid'),
    };

    // Calculate prize statistics
    const totalPrizePool = draw.prizePool.fiveMatch.amount + draw.prizePool.fourMatch.amount + draw.prizePool.threeMatch.amount;
    const prizeStats = {
      totalPrizePool: parseFloat(totalPrizePool.toFixed(2)),
      distribution: {
        fiveMatch: {
          percentage: 40,
          amount: parseFloat(draw.prizePool.fiveMatch.amount.toFixed(2)),
          winners: enrichedWinners.filter(w => w.matchType === '5').length,
          prizePerWinner: enrichedWinners.filter(w => w.matchType === '5').length > 0
            ? parseFloat((draw.prizePool.fiveMatch.amount / enrichedWinners.filter(w => w.matchType === '5').length).toFixed(2))
            : 0,
        },
        fourMatch: {
          percentage: 35,
          amount: parseFloat(draw.prizePool.fourMatch.amount.toFixed(2)),
          winners: enrichedWinners.filter(w => w.matchType === '4').length,
          prizePerWinner: enrichedWinners.filter(w => w.matchType === '4').length > 0
            ? parseFloat((draw.prizePool.fourMatch.amount / enrichedWinners.filter(w => w.matchType === '4').length).toFixed(2))
            : 0,
        },
        threeMatch: {
          percentage: 25,
          amount: parseFloat(draw.prizePool.threeMatch.amount.toFixed(2)),
          winners: enrichedWinners.filter(w => w.matchType === '3').length,
          prizePerWinner: enrichedWinners.filter(w => w.matchType === '3').length > 0
            ? parseFloat((draw.prizePool.threeMatch.amount / enrichedWinners.filter(w => w.matchType === '3').length).toFixed(2))
            : 0,
        },
      },
      rolloverAmount: draw.rolloverAmount > 0 ? parseFloat(draw.rolloverAmount.toFixed(2)) : 0,
      totalPaid: enrichedWinners.filter(w => w.verificationStatus === 'paid')
        .reduce((sum, w) => sum + w.prizeAmount, 0),
      totalPending: enrichedWinners.filter(w => w.verificationStatus !== 'paid')
        .reduce((sum, w) => sum + w.prizeAmount, 0),
    };

    return jsonResponse(
      {
        success: true,
        data: {
          month: draw.month,
          publishedAt: draw.publishedAt,
          drawnNumbers: draw.drawnNumbers,
          totalWinners: enrichedWinners.length,
          winnerStats: {
            byStatus: {
              pending: winnersByStatus.pending.length,
              approved: winnersByStatus.approved.length,
              rejected: winnersByStatus.rejected.length,
              paid: winnersByStatus.paid.length,
            },
            byMatch: {
              fiveMatch: enrichedWinners.filter(w => w.matchCount === 5).length,
              fourMatch: enrichedWinners.filter(w => w.matchCount === 4).length,
              threeMatch: enrichedWinners.filter(w => w.matchCount === 3).length,
            },
          },
          prizeStats,
          winners: {
            pending: winnersByStatus.pending,
            approved: winnersByStatus.approved,
            rejected: winnersByStatus.rejected,
            paid: winnersByStatus.paid,
            all: enrichedWinners.sort((a, b) => {
              // Sort by match type descending, then by verification status
              const matchOrder = { '5': 0, '4': 1, '3': 2 };
              const statusOrder = { pending: 0, approved: 1, rejected: 2, paid: 3 };
              if (matchOrder[a.matchType] !== matchOrder[b.matchType]) {
                return matchOrder[a.matchType] - matchOrder[b.matchType];
              }
              return statusOrder[a.verificationStatus] - statusOrder[b.verificationStatus];
            }),
          },
        },
      },
      200
    );
  } catch (error) {
    console.error('Get draw results error:', error);
    return errorResponse(
      error.message || 'Error fetching draw results',
      500,
      { error: error.message }
    );
  }
}

export const GET = handleGET;
