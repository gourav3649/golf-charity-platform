import connectDB from '@/lib/mongodb';
import Charity from '@/models/Charity';
import { jsonResponse, errorResponse } from '@/middleware/authMiddleware';

/**
 * GET /api/charities/featured
 * Get featured charities (public route)
 * Returns up to 5 featured charities sorted by creation date
 */
export async function GET(request, context) {
  try {
    await connectDB();

    // Fetch featured charities
    const charities = await Charity.find({ featured: true })
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return jsonResponse(
      {
        success: true,
        message: 'Featured charities retrieved successfully',
        data: {
          charities,
          count: charities.length,
        },
      },
      200
    );
  } catch (error) {
    console.error('Get featured charities error:', error);
    return errorResponse(
      error.message || 'Error fetching featured charities',
      500,
      { error: error.message }
    );
  }
}
