import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Charity from '@/models/Charity';
import { withAuth, errorResponse, jsonResponse } from '@/middleware/authMiddleware';

/**
 * GET /api/subscriptions/status
 * Get current user's subscription status
 * Protected route
 */
async function handleGET(request, context) {
  try {
    await connectDB();

    const userId = request.user.userId;

    // Find user with charity details
    const user = await User.findById(userId).populate('selectedCharityId', 'name description');

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Prepare subscription response
    const subscription = {
      status: user.subscription.status,
      plan: user.subscription.plan,
      startDate: user.subscription.startDate,
      renewalDate: user.subscription.renewalDate,
      cancelledDate: user.subscription.cancelledDate,
      charityContributionPercent: user.charityContributionPercent,
      selectedCharity: user.selectedCharityId ? {
        id: user.selectedCharityId._id,
        name: user.selectedCharityId.name,
        description: user.selectedCharityId.description,
      } : null,
    };

    // Calculate days until renewal if active
    let daysUntilRenewal = null;
    if (user.subscription.status === 'active' && user.subscription.renewalDate) {
      const now = new Date();
      const timeDiff = user.subscription.renewalDate - now;
      daysUntilRenewal = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    }

    // Get subscription history
    const history = user.subscriptionHistory.map(item => ({
      action: item.action,
      plan: item.plan,
      amount: item.amount,
      charityContributionAmount: item.charityContributionAmount,
      status: item.status,
      processedAt: item.processedAt,
      createdAt: item.createdAt,
    }));

    return jsonResponse(
      {
        success: true,
        message: 'Subscription status retrieved',
        data: {
          subscription,
          daysUntilRenewal,
          history,
          isActive: user.subscription.status === 'active',
        },
      },
      200
    );
  } catch (error) {
    console.error('Get subscription status error:', error);
    return errorResponse(
      error.message || 'Error fetching subscription status',
      500,
      { error: error.message }
    );
  }
}

export const GET = withAuth(handleGET);
