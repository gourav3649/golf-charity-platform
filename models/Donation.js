import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    charityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Charity',
      required: [true, 'Charity ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      enum: ['subscription-contribution', 'independent'],
      required: [true, 'Donation type is required'],
    },
    month: {
      type: String,
      match: [/^\d{4}-\d{2}$/, 'Invalid month format. Use YYYY-MM'],
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
  },
  { timestamps: true }
);

// Index for efficient queries
donationSchema.index({ userId: 1, createdAt: -1 });
donationSchema.index({ charityId: 1, createdAt: -1 });
donationSchema.index({ month: 1 });

// Static method to get donations by user
donationSchema.statics.getDonationsByUser = function (userId, limit = 20) {
  return this.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};

// Static method to get donations by charity
donationSchema.statics.getDonationsByCharity = function (charityId, limit = 20) {
  return this.find({ charityId }).sort({ createdAt: -1 }).limit(limit);
};

// Static method to get total donations for charity
donationSchema.statics.getTotalDonationsForCharity = function (charityId) {
  return this.aggregate([
    { $match: { charityId: new mongoose.Types.ObjectId(charityId), status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
};

// Static method to get donations by month
donationSchema.statics.getDonationsByMonth = function (month) {
  return this.find({ month, status: 'completed' });
};

// Method to format for response
donationSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    amount: this.amount,
    type: this.type,
    month: this.month,
    createdAt: this.createdAt,
  };
};

export default mongoose.models.Donation || mongoose.model('Donation', donationSchema);
