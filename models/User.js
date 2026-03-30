import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    firstName: {
      type: String,
      required: [true, 'Please provide first name'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Please provide last name'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    subscription: {
      status: {
        type: String,
        enum: ['active', 'inactive', 'cancelled', 'lapsed'],
        default: 'inactive',
      },
      plan: {
        type: String,
        enum: ['monthly', 'yearly', null],
        default: null,
      },
      startDate: Date,
      renewalDate: Date,
      cancelledDate: Date,
    },
    selectedCharityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Charity',
      default: null,
    },
    charityContributionPercent: {
      type: Number,
      default: 10,
      min: [10, 'Minimum charity contribution is 10%'],
      max: [100, 'Maximum charity contribution is 100%'],
    },
    subscriptionHistory: [
      {
        action: {
          type: String,
          enum: ['signup', 'renewal', 'upgrade', 'downgrade', 'cancel'],
        },
        plan: String,
        amount: Number,
        charityContributionAmount: Number,
        transactionId: String,
        status: {
          type: String,
          enum: ['success', 'pending', 'failed'],
          default: 'success',
        },
        processedAt: Date,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from output unless explicitly selected
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.models.User || mongoose.model('User', userSchema);
