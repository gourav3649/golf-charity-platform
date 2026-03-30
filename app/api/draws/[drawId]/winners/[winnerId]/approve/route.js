import connectDB from '@/lib/mongodb';
import Draw from '@/models/Draw';
import { withAdmin, errorResponse, jsonResponse } from '@/middleware/authMiddleware';

/**
 * PUT /api/draws/[drawId]/winners/[winnerId]/approve
 * Admin approves or rejects a winner's proof (admin only)
 * Body: { action: 'approve' | 'reject', note: 'optional verification note' }
 */
async function handlePUT(request, context) {
  try {
    await connectDB();

    const { drawId, winnerId } = context.params;
    const { action, note } = await request.json();

    // Validate IDs
    if (!drawId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse('Invalid draw ID', 400);
    }

    if (!winnerId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse('Invalid winner ID', 400);
    }

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return errorResponse('Action must be either "approve" or "reject"', 400);
    }

    // Fetch draw
    const draw = await Draw.findById(drawId);
    if (!draw) {
      return errorResponse('Draw not found', 404);
    }

    // Find winner
    const winnerIndex = draw.winners.findIndex(w => w._id.toString() === winnerId);
    if (winnerIndex === -1) {
      return errorResponse('Winner not found', 404);
    }

    const winner = draw.winners[winnerIndex];

    // Check if proof has been submitted
    if (!winner.proofImageUrl) {
      return errorResponse('Proof image not submitted yet', 400);
    }

    // Check if already processed
    if (['rejected', 'paid'].includes(winner.verificationStatus)) {
      return errorResponse(
        `Cannot modify ${winner.verificationStatus} winner`,
        400
      );
    }

    // Update verification status
    if (action === 'approve') {
      winner.verificationStatus = 'approved';
      winner.verifiedAt = new Date();
      winner.verificationNote = note || 'Approved by admin';
    } else {
      winner.verificationStatus = 'rejected';
      winner.verifiedAt = new Date();
      winner.verificationNote = note || 'Rejected - proof does not meet requirements';
    }

    // Save draw
    await draw.save();

    // Refresh winner data
    const updatedWinner = draw.winners[winnerIndex];

    return jsonResponse(
      {
        success: true,
        message: `Winner ${action}ed successfully`,
        data: {
          winnerId: updatedWinner._id,
          userId: updatedWinner.userId,
          matchType: updatedWinner.matchType,
          prizeAmount: parseFloat(updatedWinner.prizeAmount.toFixed(2)),
          verificationStatus: updatedWinner.verificationStatus,
          verificationNote: updatedWinner.verificationNote,
          verifiedAt: updatedWinner.verifiedAt,
          action,
          nextStep: action === 'approve'
            ? 'Winner can now claim prize. Admin marks as paid when payment is processed.'
            : 'Winner can resubmit proof if they wish to appeal.',
        },
      },
      200
    );
  } catch (error) {
    console.error('Approve/reject winner error:', error);
    return errorResponse(
      error.message || 'Error processing verification',
      500,
      { error: error.message }
    );
  }
}

export const PUT = withAdmin(handlePUT);
