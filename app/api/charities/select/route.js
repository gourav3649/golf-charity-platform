import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Charity from '@/models/Charity';
import Donation from '@/models/Donation';
import { withAuth, errorResponse, jsonResponse } from '@/middleware/authMiddleware';

/**
 * POST /api/charities/select
 * Select a charity for user and set contribution percentage
 * Protected route
 * Body: { charityId, contributionPercent: 10-100 }
 */
async function handlePOST(request, context) {
  try {
    await connectDB();

    const userId = request.user.userId;
    const { charityId, contributionPercent } = await request.json();

    // Validation
    if (!charityId) {
      return errorResponse('Charity ID is required', 400);
    }

    if (contributionPercent !== undefined && contributionPercent !== null) {
      if (!Number.isInteger(contributionPercent) || contributionPercent < 10 || contributionPercent > 100) {
        return errorResponse('Contribution percentage must be an integer between 10 and 100', 400);
      }
    }

    // Validate charity ID format
    if (!charityId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse('Invalid charity ID', 400);
    }

    // Check if charity exists
    const charity = await Charity.findById(charityId);
    if (!charity) {
      return errorResponse('Charity not found', 404);
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Get old charity ID (if any) to update subscriber counts
    const oldCharityId = user.selectedCharityId;

    // Update user's selected charity and contribution percent
    user.selectedCharityId = charityId;
    user.charityContributionPercent = contributionPercent || 10;

    await user.save();

    // Update charity subscriber counts
    if (oldCharityId && oldCharityId.toString() !== charityId) {
      // Decrement old charity
      await Charity.findByIdAndUpdate(oldCharityId, {
        $inc: { activeSubscribers: -1 },
      });
    }

    // Increment new charity (only if changing from no charity or different charity)
    if (!oldCharityId || oldCharityId.toString() !== charityId) {
      await Charity.findByIdAndUpdate(charityId, {
        $inc: { activeSubscribers: 1 },
      });
    }

    // IF USER HAS ACTIVE SUBSCRIPTION: Create donation for current month
    if (user.subscription.status === 'active') {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Get plan amount
      const planAmounts = {
        monthly: 9.99,
        yearly: 95.88,
      };

      const planAmount = planAmounts[user.subscription.plan] || 0;
      const donationAmount = (planAmount * user.charityContributionPercent) / 100;

      // Check if donation for this month already exists
      const existingDonation = await Donation.findOne({
        userId,
        charityId,
        month: currentMonth,
        type: 'subscription-contribution',
      });

      if (!existingDonation) {
        // Create donation record
        const donation = new Donation({
          userId,
          charityId,
          amount: parseFloat(donationAmount.toFixed(2)),
          type: 'subscription-contribution',
          month: currentMonth,
          transactionId: `donation-select-${userId}-${Date.now()}`,
          status: 'completed',
        });

        await donation.save();

        // Update charity totalRaised
        await Charity.findByIdAndUpdate(charityId, {
          $inc: { totalRaised: donationAmount },
        });
      }
    }

    // Fetch updated user with charity details
    const updatedUser = await User.findById(userId).populate('selectedCharityId', 'name description imageUrl');

    return jsonResponse(
      {
        success: true,
        message: 'Charity selected successfully',
        data: {
          user: updatedUser.toJSON(),
          charity: {
            id: charity._id,
            name: charity.name,
            description: charity.description,
          },
          contributionPercent: user.charityContributionPercent,
        },
      },
      200
    );
  } catch (error) {
    console.error('Select charity error:', error);
    return errorResponse(
      error.message || 'Error selecting charity',
      500,
      { error: error.message }
    );
  }
}

export const POST = withAuth(handlePOST);
