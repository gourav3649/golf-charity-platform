import mongoose from 'mongoose';

const drawSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: [true, 'Month is required (YYYY-MM format)'],
      match: [/^\d{4}-\d{2}$/, 'Invalid month format. Use YYYY-MM'],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'simulated', 'published'],
      default: 'pending',
    },
    drawType: {
      type: String,
      enum: ['random', 'algorithmic'],
      default: 'random',
    },
    drawnNumbers: {
      type: [Number],
      validate: {
        validator: function (v) {
          return v.length === 5 && v.every(n => n >= 1 && n <= 45);
        },
        message: 'Must have exactly 5 numbers between 1-45',
      },
      default: [],
    },
    winners: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        matchType: {
          type: String,
          enum: ['5', '4', '3'],
          required: true,
        },
        prizeAmount: {
          type: Number,
          required: true,
          min: 0,
        },
        winningNumbers: {
          type: [Number],
          required: true,
        },
        verificationStatus: {
          type: String,
          enum: ['pending', 'approved', 'rejected', 'paid'],
          default: 'pending',
        },
        proofImageUrl: {
          type: String,
          default: null,
        },
        proofSubmittedAt: Date,
        verificationNote: {
          type: String,
          default: '',
        },
        verifiedAt: Date,
        paidAmount: {
          type: Number,
          default: null,
        },
        paymentMethod: {
          type: String,
          enum: ['bank_transfer', 'cheque', 'digital_wallet', 'other', null],
          default: null,
        },
        transactionId: {
          type: String,
          default: null,
          sparse: true,
        },
        paymentNotes: {
          type: String,
          default: null,
        },
        remainingBalance: {
          type: Number,
          default: 0,
        },
        paidAt: Date,
        // Keep old fields for backward compatibility
        proofUrl: {
          type: String,
          default: null,
        },
        adminNotes: {
          type: String,
          default: '',
        },
      },
    ],
    prizePool: {
      fiveMatch: {
        share: {
          type: Number,
          default: 0.4, // 40%
        },
        amount: {
          type: Number,
          default: 0,
        },
      },
      fourMatch: {
        share: {
          type: Number,
          default: 0.35, // 35%
        },
        amount: {
          type: Number,
          default: 0,
        },
      },
      threeMatch: {
        share: {
          type: Number,
          default: 0.25, // 25%
        },
        amount: {
          type: Number,
          default: 0,
        },
      },
      totalPool: {
        type: Number,
        default: 0,
      },
    },
    rolloverAmount: {
      type: Number,
      default: 0, // Unclaimed 5-match jackpot
    },
    participantCount: {
      type: Number,
      default: 0,
    },
    publishedAt: Date,
  },
  { timestamps: true }
);

// Ensure unique draw per month
drawSchema.index({ month: 1, status: 1 });

// Method to calculate prize distribution
drawSchema.methods.calculatePrizeDistribution = function (totalPool) {
  this.prizePool.totalPool = totalPool;
  this.prizePool.fiveMatch.amount = totalPool * this.prizePool.fiveMatch.share;
  this.prizePool.fourMatch.amount = totalPool * this.prizePool.fourMatch.share;
  this.prizePool.threeMatch.amount = totalPool * this.prizePool.threeMatch.share;
  return this.prizePool;
};

// Method to distribute prizes among winners of same tier
drawSchema.methods.distributePrizesToWinners = function (matchType) {
  const winnersOfType = this.winners.filter(w => w.matchType === matchType);
  if (winnersOfType.length === 0) {
    if (matchType === '5') {
      // Rollover 5-match to next month
      this.rolloverAmount += this.prizePool.fiveMatch.amount;
    }
    return;
  }

  let poolAmount = this.prizePool[matchType === '5' ? 'fiveMatch' : matchType === '4' ? 'fourMatch' : 'threeMatch'].amount;

  const prizePerWinner = poolAmount / winnersOfType.length;

  winnersOfType.forEach(winner => {
    winner.prizeAmount = parseFloat(prizePerWinner.toFixed(2));
  });
};

// Method to check if draw has all required components to publish
drawSchema.methods.canPublish = function () {
  return this.drawnNumbers.length === 5 && this.status === 'simulated';
};

// Static method to get current month draw
drawSchema.statics.getCurrentMonthDraw = function () {
  const date = new Date();
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  return this.findOne({ month });
};

export default mongoose.models.Draw || mongoose.model('Draw', drawSchema);
