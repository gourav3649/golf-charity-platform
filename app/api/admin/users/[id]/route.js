import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import GolfScore from '@/models/GolfScore';
import Charity from '@/models/Charity';
import mongoose from 'mongoose';
import { withAdmin, errorResponse, jsonResponse } from '@/middleware/authMiddleware';

/**
 * GET /api/admin/users/[id]
 * Get single user with full details (admin only)
 */
async function handleGET(request, context) {
  try {
    await connectDB();

    const { id } = context.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse('Invalid user ID', 400);
    }

    // Fetch user with populated charity
    const user = await User.findById(id)
      .populate('selectedCharityId', 'name category description');

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Fetch golf scores
    const golfScore = await GolfScore.findOne({ userId: id });

    // Fetch subscription history for this user
    const subscriptionHistory = user.subscriptionHistory || [];

    // Fetch donation count
    const donationCount = await mongoose.connection.collection('donations')
      .countDocuments({ userId: new mongoose.Types.ObjectId(id) });

    // Calculate statistics
    const scores = golfScore?.scores || [];
    const averageScore = scores.length > 0
      ? (scores.reduce((sum, s) => sum + s.value, 0) / scores.length).toFixed(2)
      : 0;

    const bestScore = scores.length > 0
      ? Math.max(...scores.map(s => s.value))
      : null;

    const worstScore = scores.length > 0
      ? Math.min(...scores.map(s => s.value))
      : null;

    return jsonResponse(
      {
        success: true,
        data: {
          id: user._id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role || 'user',
          subscription: {
            status: user.subscription.status,
            plan: user.subscription.plan || 'none',
            startDate: user.subscription.startDate,
            renewalDate: user.subscription.renewalDate,
            amount: user.subscription.amount,
          },
          selectedCharity: user.selectedCharityId || null,
          charityContributionPercent: user.charityContributionPercent || 0,
          golfScores: {
            count: scores.length,
            averageScore: parseFloat(averageScore),
            bestScore,
            worstScore,
            scores: scores.map((s, idx) => ({
              value: s.value,
              date: s.date,
              rank: idx + 1,
            })),
          },
          donations: {
            count: donationCount,
          },
          subscriptionHistory: subscriptionHistory.map(sh => ({
            action: sh.action,
            plan: sh.plan,
            amount: sh.amount,
            charityContributionAmount: sh.charityContributionAmount,
            status: sh.status,
            processedAt: sh.processedAt,
            createdAt: sh.createdAt,
          })),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      200
    );
  } catch (error) {
    console.error('Get user error:', error);
    return errorResponse(
      error.message || 'Error fetching user',
      500,
      { error: error.message }
    );
  }
}

/**
 * PUT /api/admin/users/[id]
 * Edit user profile and scores (admin only)
 * Body: { name, charityContributionPercent, scoreToDelete }
 */
async function handlePUT(request, context) {
  try {
    await connectDB();

    const { id } = context.params;
    const { name, charityContributionPercent, scoreToDelete } = await request.json();

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse('Invalid user ID', 400);
    }

    // Fetch user
    const user = await User.findById(id);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Update name if provided
    if (name && typeof name === 'string') {
      const [firstName, ...lastNameParts] = name.trim().split(' ');
      user.firstName = firstName;
      user.lastName = lastNameParts.join(' ');
    }

    // Update charity contribution percentage if provided
    if (charityContributionPercent !== undefined) {
      const percent = parseInt(charityContributionPercent);
      if (percent < 10 || percent > 100) {
        return errorResponse('Charity contribution percent must be between 10 and 100', 400);
      }
      user.charityContributionPercent = percent;
    }

    // Save user changes
    await user.save();

    // Handle score deletion if requested
    if (scoreToDelete) {
      const golfScore = await GolfScore.findOne({ userId: id });
      if (golfScore) {
        // Find and remove the score
        const scoreIndex = golfScore.scores.findIndex(
          s => s._id.toString() === scoreToDelete
        );
        if (scoreIndex !== -1) {
          golfScore.scores.splice(scoreIndex, 1);
          await golfScore.save();
        }
      }
    }

    // Fetch updated data
    const golfScore = await GolfScore.findOne({ userId: id });
    const scores = golfScore?.scores || [];

    return jsonResponse(
      {
        success: true,
        message: 'User updated successfully',
        data: {
          id: user._id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          charityContributionPercent: user.charityContributionPercent,
          golfScores: {
            count: scores.length,
            updated: scoreToDelete ? true : false,
          },
        },
      },
      200
    );
  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse(
      error.message || 'Error updating user',
      500,
      { error: error.message }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user and all associated data (admin only)
 */
async function handleDELETE(request, context) {
  try {
    await connectDB();

    const { id } = context.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse('Invalid user ID', 400);
    }

    // Fetch user to get details before deletion
    const user = await User.findById(id);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    const userEmail = user.email;

    // Delete user
    await User.findByIdAndDelete(id);

    // Delete golf scores
    await GolfScore.deleteOne({ userId: id });

    // Delete donations
    await mongoose.connection.collection('donations')
      .deleteMany({ userId: new mongoose.Types.ObjectId(id) });

    // If user had active subscription, decrement charity subscriber count
    if (user.subscription.status === 'active' && user.selectedCharityId) {
      await Charity.findByIdAndUpdate(
        user.selectedCharityId,
        { $inc: { activeSubscribers: -1 } }
      );
    }

    return jsonResponse(
      {
        success: true,
        message: 'User deleted successfully',
        data: {
          deletedUserId: id,
          deletedEmail: userEmail,
          message: 'All associated data (scores, donations) has been removed.',
        },
      },
      200
    );
  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse(
      error.message || 'Error deleting user',
      500,
      { error: error.message }
    );
  }
}

export const GET = withAdmin(handleGET);
export const PUT = withAdmin(handlePUT);
export const DELETE = withAdmin(handleDELETE);
