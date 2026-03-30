import connectDB from '@/lib/mongodb';
import Charity from '@/models/Charity';
import { withAuth, withAdmin, errorResponse, jsonResponse } from '@/middleware/authMiddleware';

/**
 * GET /api/charities
 * Get all charities with search and category filter
 * Public route
 * Query params: { search?: string, category?: string, limit?: number, page?: number }
 */
async function handleGET(request, context) {
  try {
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    // Build query
    let query = {};

    // Text search
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const charities = await Charity.find(query)
      .select('-__v')
      .sort({ featured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Charity.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return jsonResponse(
      {
        success: true,
        message: 'Charities retrieved successfully',
        data: {
          charities,
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
    console.error('Get charities error:', error);
    return errorResponse(
      error.message || 'Error fetching charities',
      500,
      { error: error.message }
    );
  }
}

/**
 * POST /api/charities
 * Add new charity (admin only)
 * Protected route (admin)
 * Body: { name, description, imageUrl, category, website, featured }
 */
async function handlePOST(request, context) {
  try {
    await connectDB();

    const { name, description, imageUrl, category, website, featured } = await request.json();

    // Validation
    if (!name || !description || !category) {
      return errorResponse('Name, description, and category are required', 400);
    }

    if (!['health', 'education', 'environment', 'sports', 'community', 'other'].includes(category)) {
      return errorResponse('Invalid category', 400);
    }

    // Check if charity name already exists
    const existingCharity = await Charity.findOne({ name });
    if (existingCharity) {
      return errorResponse('Charity with this name already exists', 409);
    }

    // Validate website URL if provided
    if (website && !website.match(/^https?:\/\//)) {
      return errorResponse('Website must start with http:// or https://', 400);
    }

    // Create new charity
    const newCharity = new Charity({
      name: name.trim(),
      description: description.trim(),
      imageUrl: imageUrl || '/images/default-charity.jpg',
      category,
      website: website || null,
      featured: featured || false,
      upcomingEvents: [],
      totalRaised: 0,
      activeSubscribers: 0,
    });

    await newCharity.save();

    return jsonResponse(
      {
        success: true,
        message: 'Charity added successfully',
        data: {
          charity: newCharity,
        },
      },
      201
    );
  } catch (error) {
    console.error('Add charity error:', error);

    if (error.code === 11000) {
      return errorResponse('Charity name already exists', 409);
    }

    return errorResponse(
      error.message || 'Error adding charity',
      500,
      { error: error.message }
    );
  }
}

export const GET = async (request) => handleGET(request, {});
export const POST = withAdmin(handlePOST);
