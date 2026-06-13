import connectDB from '@/lib/mongodb';
import Draw from '@/models/Draw';
import { withAdmin, errorResponse, jsonResponse } from '@/middleware/authMiddleware';

/**
 * PUT /api/draws/[drawId]/winners/[winnerId]/mark-paid
 * Admin marks an approved winner as paid (admin only)
 * Body: { amount, paymentMethod, transactionId, notes }
 */
async function handlePUT(request, context) {
  try {
    await connectDB();

    const { drawId, winnerId } = context.params;
    const body = await request.json();
    const { amount, paymentMethod, transactionId, notes } = body;

    // Validate IDs
    if (!drawId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse('Invalid draw ID', 400);
    }

    if (!winnerId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse('Invalid winner ID', 400);
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return errorResponse('Valid payment amount is required', 400);
    }

    if (typeof amount !== 'number') {
      return errorResponse('Amount must be a number', 400);
    }

    // Validate payment method
    const validMethods = ['bank_transfer', 'cheque', 'digital_wallet', 'other'];
    if (!paymentMethod || !validMethods.includes(paymentMethod)) {
      return errorResponse(
        `Payment method must be one of: ${validMethods.join(', ')}`,
        400
      );
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

    // Check if approved
    if (winner.verificationStatus !== 'approved') {
      return errorResponse(
        'Only approved winners can be marked as paid',
        400
      );
    }

    // Check if already paid
    if (winner.verificationStatus === 'paid') {
      return errorResponse('Winner already marked as paid', 400);
    }

    // Verify amount matches prize or is a partial payment
    if (amount > winner.prizeAmount) {
      return errorResponse(
        `Payment amount ($${amount.toFixed(2)}) cannot exceed prize amount ($${winner.prizeAmount.toFixed(2)})`,
        400
      );
    }

    // Update winner payment status
    winner.verificationStatus = 'paid';
    winner.paidAt = new Date();
    winner.paidAmount = amount;
    winner.paymentMethod = paymentMethod;
    winner.transactionId = transactionId || null;
    winner.paymentNotes = notes || null;

    // Check if this was a partial payment
    if (amount < winner.prizeAmount) {
      winner.paymentNotes = (notes || '') + ` [Partial Payment: $${amount.toFixed(2)} of $${winner.prizeAmount.toFixed(2)}]`;
      winner.remainingBalance = winner.prizeAmount - amount;
    } else {
      winner.remainingBalance = 0;
    }

    // Save draw
    await draw.save();

    // Refresh winner data
    const updatedWinner = draw.winners[winnerIndex];

    return jsonResponse(
      {
        success: true,
        message: 'Winner marked as paid successfully',
        data: {
          winnerId: updatedWinner._id,
          userId: updatedWinner.userId,
          matchType: updatedWinner.matchType,
          prizeAmount: parseFloat(updatedWinner.prizeAmount.toFixed(2)),
          paidAmount: parseFloat(updatedWinner.paidAmount.toFixed(2)),
          remainingBalance: updatedWinner.remainingBalance || 0,
          verificationStatus: updatedWinner.verificationStatus,
          paymentMethod: updatedWinner.paymentMethod,
          transactionId: updatedWinner.transactionId,
          paidAt: updatedWinner.paidAt,
          paymentNotes: updatedWinner.paymentNotes,
          confirmationMessage: updatedWinner.remainingBalance > 0
            ? `Partial payment recorded. Balance of $${updatedWinner.remainingBalance.toFixed(2)} outstanding.`
            : 'Full payment recorded. Winner has received complete prize amount.',
        },
      },
      200
    );
  } catch (error) {
    console.error('Mark winner paid error:', error);
    return errorResponse(
      error.message || 'Error marking winner as paid',
      500,
      { error: error.message }
    );
  }
}

export const PUT = withAdmin(handlePUT);
