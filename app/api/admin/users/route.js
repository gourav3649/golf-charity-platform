import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import GolfScore from '@/models/GolfScore';
import Charity from '@/models/Charity';
import { withAdmin, errorResponse, jsonResponse } from '@/middleware/authMiddleware';

/**
 * GET /api/admin/users
 * Get all users with subscription status and score count (admin only)
 * Query params: page=1, limit=10, subscriptionStatus=active|inactive|cancelled|lapsed, sortBy=createdAt|email|name
 */
async function handleGET(request) {
  try {
    await connectDB();

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const subscriptionStatus = searchParams.get('subscriptionStatus');
    const sortBy = searchParams.get('sortBy') || 'createdAt';

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return errorResponse('Invalid pagination parameters', 400);
    }

    // Build filter query
    const filter = {};
    if (subscriptionStatus) {
      const validStatuses = ['active', 'inactive', 'cancelled', 'lapsed'];
      if (validStatuses.includes(subscriptionStatus)) {
        filter['subscription.status'] = subscriptionStatus;
      }
    }

    // Validate sortBy
    const validSortFields = ['createdAt', 'email', 'name', 'subscription.status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = 1; // Ascending

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch users with populated charity reference
    const users = await User.find(filter)
      .select('email name subscription role createdAt')
      .populate('selectedCharityId', 'name')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Enrich users with golf score info and subscription details
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        // Get golf score count and average
        const golfScore = await GolfScore.findOne({ userId: user._id })
          .select('scores')
          .lean();

        const scoreCount = golfScore?.scores?.length || 0;
        const averageScore = golfScore && golfScore.scores && golfScore.scores.length > 0
          ? (golfScore.scores.reduce((sum, s) => sum + s.value, 0) / golfScore.scores.length).toFixed(2)
          : 0;

        // Calculate days until renewal if active
        let daysUntilRenewal = null;
        if (user.subscription.status === 'active' && user.subscription.renewalDate) {
          const today = new Date();
          const renewDate = new Date(user.subscription.renewalDate);
          daysUntilRenewal = Math.ceil((renewDate - today) / (1000 * 60 * 60 * 24));
        }

        return {
          id: user._id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role || 'user',
          subscriptionStatus: user.subscription.status,
          subscriptionPlan: user.subscription.plan || 'none',
          subscriptionStartDate: user.subscription.startDate,
          daysUntilRenewal,
          charitySelected: user.selectedCharityId?.name || 'None',
          charityContribution: user.charityContributionPercent || 0,
          golfScores: {
            count: scoreCount,
            averageScore: parseFloat(averageScore),
          },
          createdAt: user.createdAt,
        };
      })
    );

    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    return jsonResponse(
      {
        success: true,
        data: {
          pagination: {
            page,
            limit,
            totalUsers,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
          users: enrichedUsers,
          filters: {
            subscriptionStatus: subscriptionStatus || 'all',
            sortBy: sortField,
          },
        },
      },
      200
    );
  } catch (error) {
    console.error('Get users error:', error);
    return errorResponse(
      error.message || 'Error fetching users',
      500,
      { error: error.message }
    );
  }
}

export const GET = withAdmin(handleGET);
