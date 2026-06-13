import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Donation from '@/models/Donation';
import User from '@/models/User';
import Charity from '@/models/Charity';
import { withAuth, errorResponse, jsonResponse } from '@/middleware/authMiddleware';

/**
 * GET /api/donations
 * Get user's donation history (subscription-contribution + independent)
 * Protected route
 * Query params: { limit?: number, page?: number }
 */
async function handleGET(request, context) {
  try {
    await connectDB();

    const userId = request.user.userId;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    // Calculate skip
    const skip = (page - 1) * limit;

    // Fetch user's donations
    const donations = await Donation.find({ userId })
      .populate('charityId', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Donation.countDocuments({ userId });
    const totalPages = Math.ceil(total / limit);

    // Calculate totals by type
    const stats = await Donation.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]).exec();

    const statsByType = {};
    stats.forEach(stat => {
      statsByType[stat._id] = {
        total: stat.total,
        count: stat.count,
      };
    });

    return jsonResponse(
      {
        success: true,
        message: 'Donation history retrieved',
        data: {
          donations,
          stats: {
            totalDonated: Object.values(statsByType).reduce((sum, stat) => sum + stat.total, 0),
            byType: statsByType,
          },
          pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
      },
      200
    );
  } catch (error) {
    console.error('Get donations error:', error);
    return errorResponse(
      error.message || 'Error fetching donation history',
      500,
      { error: error.message }
    );
  }
}

/**
 * POST /api/donations
 * Make independent donation to a charity
 * Protected route
 * Body: { charityId, amount }
 */
async function handlePOST(request, context) {
  try {
    await connectDB();

    const userId = request.user.userId;
    const { charityId, amount } = await request.json();

    // Validation
    if (!charityId || amount === undefined || amount === null) {
      return errorResponse('Charity ID and amount are required', 400);
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return errorResponse('Amount must be a positive number', 400);
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

    // Get current month for donation record
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Create donation record
    const donation = new Donation({
      userId,
      charityId,
      amount: parseFloat(amount.toFixed(2)),
      type: 'independent',
      month: currentMonth,
      transactionId: `independent-${userId}-${Date.now()}`,
      status: 'completed',
    });

    await donation.save();

    // Update charity totalRaised
    await Charity.findByIdAndUpdate(charityId, {
      $inc: { totalRaised: amount },
    });

    // Fetch created donation with charity details
    const populatedDonation = await Donation.findById(donation._id)
      .populate('charityId', 'name description')
      .lean();

    return jsonResponse(
      {
        success: true,
        message: 'Donation made successfully. Thank you for supporting the cause!',
        data: {
          donation: populatedDonation,
        },
      },
      201
    );
  } catch (error) {
    console.error('Create donation error:', error);
    return errorResponse(
      error.message || 'Error creating donation',
      500,
      { error: error.message }
    );
  }
}

export const GET = withAuth(handleGET);
export const POST = withAuth(handlePOST);
