import connectDB from '@/lib/mongodb';
import Draw from '@/models/Draw';
import { withAdmin, errorResponse, jsonResponse } from '@/middleware/authMiddleware';

/**
 * POST /api/draws/create
 * Create a new monthly draw (admin only)
 * Body: { month?, drawType?: "random" | "algorithmic" }
 * If month not provided, uses current month
 */
async function handlePOST(request, context) {
  try {
    await connectDB();

    let { month, drawType } = await request.json() || {};

    // Use current month if not provided
    if (!month) {
      const now = new Date();
      month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    // Validate month format
    if (!month.match(/^\d{4}-\d{2}$/)) {
      return errorResponse('Invalid month format. Use YYYY-MM', 400);
    }

    // Default to random draw type
    drawType = drawType || 'random';
    if (!['random', 'algorithmic'].includes(drawType)) {
      return errorResponse('Invalid draw type. Must be "random" or "algorithmic"', 400);
    }

    // Check if draw already exists for this month
    const existingDraw = await Draw.findOne({ month });
    if (existingDraw) {
      return errorResponse(
        `Draw for ${month} already exists with status: ${existingDraw.status}`,
        409
      );
    }

    // Generate 5 random numbers between 1-45 (Stableford format)
    const drawnNumbers = [];
    while (drawnNumbers.length < 5) {
      const randomNum = Math.floor(Math.random() * 45) + 1;
      if (!drawnNumbers.includes(randomNum)) {
        drawnNumbers.push(randomNum);
      }
    }

    // Sort for display
    drawnNumbers.sort((a, b) => a - b);

    // Create new draw
    const newDraw = new Draw({
      month,
      status: 'pending',
      drawType,
      drawnNumbers,
      winners: [],
      prizePool: {
        fiveMatch: { share: 0.4, amount: 0 },
        fourMatch: { share: 0.35, amount: 0 },
        threeMatch: { share: 0.25, amount: 0 },
        totalPool: 0,
      },
      rolloverAmount: 0,
      participantCount: 0,
    });

    await newDraw.save();

    return jsonResponse(
      {
        success: true,
        message: `Draw for ${month} created successfully`,
        data: {
          draw: {
            id: newDraw._id,
            month: newDraw.month,
            status: newDraw.status,
            drawType: newDraw.drawType,
            drawnNumbers: newDraw.drawnNumbers,
            message: 'Draw is now ready for simulation. Run simulation to process participant scores.',
          },
        },
      },
      201
    );
  } catch (error) {
    console.error('Create draw error:', error);
    return errorResponse(
      error.message || 'Error creating draw',
      500,
      { error: error.message }
    );
  }
}

export const POST = withAdmin(handlePOST);
