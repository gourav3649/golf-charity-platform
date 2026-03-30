import mongoose from 'mongoose';

const golfScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    scores: [
      {
        value: {
          type: Number,
          required: [true, 'Score value is required'],
          min: [1, 'Score must be at least 1'],
          max: [45, 'Score cannot exceed 45 (Stableford format)'],
        },
        date: {
          type: Date,
          required: [true, 'Score date is required'],
          validate: {
            validator: function (v) {
              return v <= new Date();
            },
            message: 'Score date cannot be in the future',
          },
        },
      },
    ],
  },
  { timestamps: true }
);

// Keep only last 5 scores (newest first)
golfScoreSchema.pre('save', function (next) {
  if (this.scores.length > 5) {
    // Sort by date descending (newest first)
    this.scores.sort((a, b) => new Date(b.date) - new Date(a.date));
    // Keep only first 5
    this.scores = this.scores.slice(0, 5);
  }
  next();
});

// Method to add a new score
golfScoreSchema.methods.addScore = function (scoreValue, scoreDate) {
  const newScore = {
    value: scoreValue,
    date: scoreDate,
  };

  this.scores.push(newScore);

  // Sort by date descending (newest first)
  this.scores.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Keep only first 5
  if (this.scores.length > 5) {
    this.scores = this.scores.slice(0, 5);
  }

  return this.scores;
};

// Method to get scores sorted by date (most recent first)
golfScoreSchema.methods.getScoresSorted = function () {
  return this.scores.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// Method to get last N scores
golfScoreSchema.methods.getLastScores = function (count = 5) {
  return this.scores.slice(0, count);
};

// Virtual for average score
golfScoreSchema.virtual('averageScore').get(function () {
  if (this.scores.length === 0) return 0;
  const sum = this.scores.reduce((acc, score) => acc + score.value, 0);
  return (sum / this.scores.length).toFixed(2);
});

// Ensure virtuals are included in JSON output
golfScoreSchema.set('toJSON', { virtuals: true });

export default mongoose.models.GolfScore || mongoose.model('GolfScore', golfScoreSchema);
