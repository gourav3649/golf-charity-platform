import connectDB from '@/lib/mongodb';
import Draw from '@/models/Draw';
import { withAdmin, errorResponse, jsonResponse } from '@/middleware/authMiddleware';

/**
 * GET /api/admin/draws
 * Get all draws with optional status filter (admin only)
 * Query params: status=pending|simulated|published, page=1, limit=10, sortBy=month|createdAt|status
 */
async function handleGET(request) {
  try {
    await connectDB();

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'month';

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return errorResponse('Invalid pagination parameters', 400);
    }

    // Build filter query
    const filter = {};
    if (status) {
      const validStatuses = ['pending', 'simulated', 'published'];
      if (validStatuses.includes(status)) {
        filter.status = status;
      } else {
        return errorResponse(
          'Invalid status. Must be: pending, simulated, or published',
          400
        );
      }
    }

    // Validate sortBy
    const validSortFields = ['month', 'createdAt', 'status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'month';
    const sortOrder = sortField === 'month' ? -1 : -1; // Newest first

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch draws
    const draws = await Draw.find(filter)
      .select(
        'month status drawnNumbers winners prizePool publishedAt createdAt participantCount'
      )
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Enrich draws with statistics
    const enrichedDraws = draws.map(draw => {
      const winnersByType = {
        '5': draw.winners.filter(w => w.matchType === '5').length,
        '4': draw.winners.filter(w => w.matchType === '4').length,
        '3': draw.winners.filter(w => w.matchType === '3').length,
      };

      const winnersByStatus = {
        pending: draw.winners.filter(w => w.verificationStatus === 'pending').length,
        approved: draw.winners.filter(w => w.verificationStatus === 'approved').length,
        rejected: draw.winners.filter(w => w.verificationStatus === 'rejected').length,
        paid: draw.winners.filter(w => w.verificationStatus === 'paid').length,
      };

      const totalPrizePool =
        draw.prizePool.fiveMatch.amount +
        draw.prizePool.fourMatch.amount +
        draw.prizePool.threeMatch.amount;

      return {
        id: draw._id,
        month: draw.month,
        status: draw.status,
        drawnNumbers: draw.drawnNumbers || [],
        participantCount: draw.participantCount || 0,
        totalWinners: draw.winners.length,
        winnersByMatchType: winnersByType,
        winnersByVerificationStatus: winnersByStatus,
        prizeDistribution: {
          fiveMatch: {
            amount: parseFloat(draw.prizePool.fiveMatch.amount.toFixed(2)),
            share: 40,
          },
          fourMatch: {
            amount: parseFloat(draw.prizePool.fourMatch.amount.toFixed(2)),
            share: 35,
          },
          threeMatch: {
            amount: parseFloat(draw.prizePool.threeMatch.amount.toFixed(2)),
            share: 25,
          },
        },
        totalPrizePool: parseFloat(totalPrizePool.toFixed(2)),
        publishedAt: draw.publishedAt || null,
        createdAt: draw.createdAt,
      };
    });

    // Get total count for pagination
    const totalDraws = await Draw.countDocuments(filter);
    const totalPages = Math.ceil(totalDraws / limit);

    // Count draws by status
    const statusCounts = await Draw.aggregate([
      { $match: status ? { status } : {} },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      pending: 0,
      simulated: 0,
      published: 0,
    };
    statusCounts.forEach(sc => {
      if (counts.hasOwnProperty(sc._id)) {
        counts[sc._id] = sc.count;
      }
    });

    return jsonResponse(
      {
        success: true,
        data: {
          pagination: {
            page,
            limit,
            totalDraws,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
          statusCounts: counts,
          filters: {
            status: status || 'all',
            sortBy: sortField,
          },
          draws: enrichedDraws,
        },
      },
      200
    );
  } catch (error) {
    console.error('Get draws error:', error);
    return errorResponse(
      error.message || 'Error fetching draws',
      500,
      { error: error.message }
    );
  }
}

export const GET = withAdmin(handleGET);
