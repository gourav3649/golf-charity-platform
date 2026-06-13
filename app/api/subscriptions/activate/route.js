import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Charity from '@/models/Charity';
import Donation from '@/models/Donation';
import { withAuth, errorResponse, jsonResponse } from '@/middleware/authMiddleware';

/**
 * POST /api/subscriptions/activate
 * Activate subscription for user (mock payment)
 * Protected route
 * Body: { plan: "monthly" | "yearly" }
 */
async function handlePOST(request, context) {
  try {
    await connectDB();

    const userId = request.user.userId;
    const { plan } = await request.json();

    // Validation
    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return errorResponse('Valid plan required: monthly or yearly', 400);
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Check if user already has active subscription
    if (user.subscription.status === 'active') {
      return errorResponse('User already has an active subscription', 409);
    }

    // Plan pricing
    const planPricing = {
      monthly: {
        amount: 9.99,
        durationDays: 30,
      },
      yearly: {
        amount: 95.88,
        durationDays: 365,
      },
    };

    const pricing = planPricing[plan];
    const now = new Date();
    const renewalDate = new Date(now.getTime() + pricing.durationDays * 24 * 60 * 60 * 1000);

    // Update user subscription
    user.subscription.status = 'active';
    user.subscription.plan = plan;
    user.subscription.startDate = now;
    user.subscription.renewalDate = renewalDate;
    user.subscription.cancelledDate = null;

    // Calculate charity contribution amount
    const charityContributionAmount = (pricing.amount * user.charityContributionPercent) / 100;

    // Add to subscription history
    user.subscriptionHistory.push({
      action: 'signup',
      plan,
      amount: pricing.amount,
      charityContributionAmount,
      transactionId: `mock-${userId}-${Date.now()}`, // Mock transaction ID
      status: 'success',
      processedAt: now,
    });

    // Save user
    await user.save();

    // Create donation record if user has selected a charity
    if (user.selectedCharityId) {
      // Get current month in YYYY-MM format
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Create donation record
      const donation = new Donation({
        userId,
        charityId: user.selectedCharityId,
        amount: charityContributionAmount,
        type: 'subscription-contribution',
        month: currentMonth,
        transactionId: `donation-${userId}-${Date.now()}`,
        status: 'completed',
      });

      await donation.save();

      // Update charity totalRaised and activeSubscribers
      await Charity.findByIdAndUpdate(user.selectedCharityId, {
        $inc: {
          totalRaised: charityContributionAmount,
          activeSubscribers: 1,
        },
      });
    }

    // Prepare response
    const userResponse = user.toJSON();

    return jsonResponse(
      {
        success: true,
        message: 'Subscription activated successfully',
        data: {
          user: userResponse,
          subscription: {
            status: user.subscription.status,
            plan: user.subscription.plan,
            startDate: user.subscription.startDate,
            renewalDate: user.subscription.renewalDate,
            amount: pricing.amount,
            charityContribution: charityContributionAmount,
          },
        },
      },
      201
    );
  } catch (error) {
    console.error('Activate subscription error:', error);
    return errorResponse(
      error.message || 'Error activating subscription',
      500,
      { error: error.message }
    );
  }
}

export const POST = withAuth(handlePOST);
