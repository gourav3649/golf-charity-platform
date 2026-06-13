import connectDB from '@/lib/mongodb';
import Charity from '@/models/Charity';
import { jsonResponse, errorResponse } from '@/middleware/authMiddleware';

/**
 * GET /api/charities/[id]
 * Get single charity profile with upccoming events
 * Public route
 */
export async function GET(request, context) {
  try {
    await connectDB();

    const { id } = context.params;

    // Validate MongoDB ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse('Invalid charity ID', 400);
    }

    // Fetch charity
    const charity = await Charity.findById(id).lean();

    if (!charity) {
      return errorResponse('Charity not found', 404);
    }

    // Filter upcoming events (only future events)
    const now = new Date();
    const upcomingEvents = (charity.upcomingEvents || []).filter(
      event => new Date(event.eventDate) > now
    );

    // Prepare response
    const charityResponse = {
      ...charity,
      upcomingEvents: upcomingEvents.sort((a, b) => 
        new Date(a.eventDate) - new Date(b.eventDate)
      ),
    };

    return jsonResponse(
      {
        success: true,
        message: 'Charity profile retrieved',
        data: {
          charity: charityResponse,
        },
      },
      200
    );
  } catch (error) {
    console.error('Get charity profile error:', error);
    return errorResponse(
      error.message || 'Error fetching charity profile',
      500,
      { error: error.message }
    );
  }
}
