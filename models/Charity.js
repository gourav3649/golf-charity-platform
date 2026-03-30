import mongoose from 'mongoose';

const charitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Charity name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Charity description is required'],
    },
    imageUrl: {
      type: String,
      default: '/images/default-charity.jpg',
    },
    category: {
      type: String,
      enum: ['health', 'education', 'environment', 'sports', 'community', 'other'],
      required: [true, 'Category is required'],
    },
    website: {
      type: String,
      match: [/^https?:\/\//, 'Please provide valid website URL'],
      default: null,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    upcomingEvents: [
      {
        eventName: {
          type: String,
          required: true,
        },
        eventDate: {
          type: Date,
          required: true,
        },
        description: String,
      },
    ],
    totalRaised: {
      type: Number,
      default: 0,
      min: 0,
    },
    activeSubscribers: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Index for search
charitySchema.index({ name: 'text', description: 'text', category: 1 });

// Method to increment active subscribers
charitySchema.methods.incrementSubscribers = function () {
  this.activeSubscribers += 1;
  return this.save();
};

// Method to decrement active subscribers
charitySchema.methods.decrementSubscribers = function () {
  if (this.activeSubscribers > 0) {
    this.activeSubscribers -= 1;
  }
  return this.save();
};

// Method to add raised amount
charitySchema.methods.addRaisedAmount = function (amount) {
  this.totalRaised += amount;
  return this.save();
};

// Static method to get featured charities
charitySchema.statics.getFeatured = function () {
  return this.find({ featured: true }).limit(5);
};

// Static method to search charities
charitySchema.statics.searchCharities = function (searchTerm, category = null) {
  let query = {};

  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }

  if (category && category !== 'all') {
    query.category = category;
  }

  return this.find(query);
};

export default mongoose.models.Charity || mongoose.model('Charity', charitySchema);
