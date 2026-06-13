import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Charity from '@/models/Charity';
import { withAuth, errorResponse, jsonResponse } from '@/middleware/authMiddleware';

/**
 * POST /api/subscriptions/cancel
 * Cancel user's subscription
 * Protected route
 */
async function handlePOST(request, context) {
  try {
    await connectDB();

    const userId = request.user.userId;

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Check if subscription is active or lapsed
    if (!['active', 'lapsed'].includes(user.subscription.status)) {
      return errorResponse(
        'No active or lapsed subscription to cancel',
        400
      );
    }

    const now = new Date();

    // Update subscription status
    user.subscription.status = 'cancelled';
    user.subscription.cancelledDate = now;

    // Get previous plan info for history
    const previousPlan = user.subscription.plan;
    const previousAmount = previousPlan === 'monthly' ? 9.99 : 95.88;

    // Add cancellation to subscription history
    user.subscriptionHistory.push({
      action: 'cancel',
      plan: previousPlan,
      amount: previousAmount,
      status: 'success',
      processedAt: now,
    });

    // Save user changes
    await user.save();

    // Decrement charity active subscribers if charity was selected
    if (user.selectedCharityId) {
      await Charity.findByIdAndUpdate(user.selectedCharityId, {
        $inc: {
          activeSubscribers: -1,
        },
      });
    }

    // Prepare response
    const userResponse = user.toJSON();

    return jsonResponse(
      {
        success: true,
        message: 'Subscription cancelled successfully',
        data: {
          user: userResponse,
          subscription: {
            status: user.subscription.status,
            cancelledDate: user.subscription.cancelledDate,
            message: 'Your subscription has been cancelled. You can reactivate it anytime.',
          },
        },
      },
      200
    );
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return errorResponse(
      error.message || 'Error cancelling subscription',
      500,
      { error: error.message }
    );
  }
}

export const POST = withAuth(handlePOST);
