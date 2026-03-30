import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Charity from '../models/Charity.js';

dotenv.config({ path: '.env.local' });

const charities = [
  {
    name: 'Hope Health Foundation',
    description: 'Providing quality healthcare to underserved communities and ensuring access to medical treatment for all.',
    category: 'health',
    website: 'https://hopehealthfoundation.org',
    featured: true,
  },
  {
    name: 'Global Education Initiative',
    description: 'Empowering young minds through education, providing scholarships and educational resources to disadvantaged students worldwide.',
    category: 'education',
    website: 'https://globaleducationinitiative.org',
    featured: true,
  },
  {
    name: 'Green Earth Alliance',
    description: 'Protecting our planet through environmental conservation, sustainable practices, and climate action programs.',
    category: 'environment',
    website: 'https://greenearthalliance.org',
    featured: false,
  },
  {
    name: 'Youth Sports for All',
    description: 'Building character and promoting healthy lifestyles by providing sports programs and equipment to youth in need.',
    category: 'sports',
    website: 'https://youthsportsforall.org',
    featured: false,
  },
  {
    name: 'Community Care Network',
    description: 'Strengthening communities through local initiatives, food banks, shelter programs, and social support services.',
    category: 'community',
    website: 'https://communitycarebetwee.org',
    featured: false,
  },
];

const adminUser = {
  email: 'admin@golfcharity.com',
  password: 'Admin123!',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
  subscription: {
    status: 'active',
    plan: 'monthly',
    startDate: new Date(),
    renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    charityId: null,
    contributionPercent: 0,
  },
};

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');
    console.log(`📍 Connecting to MongoDB: ${process.env.MONGODB_URI}`);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ==================== CHARITIES ====================
    console.log('\n📚 Seeding Charities...');

    for (const charity of charities) {
      // Check if charity already exists
      const existingCharity = await Charity.findOne({ name: charity.name });

      if (existingCharity) {
        console.log(`  ⏭️  Skipped: ${charity.name} (already exists)`);
      } else {
        const newCharity = await Charity.create(charity);
        console.log(
          `  ✅ Created: ${charity.name}${charity.featured ? ' ⭐ (Featured)' : ''}`
        );
      }
    }

    // ==================== ADMIN USER ====================
    console.log('\n👤 Seeding Admin User...');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });

    if (existingAdmin) {
      console.log(`  ⏭️  Skipped: ${adminUser.email} (already exists)`);
    } else {
      // Create admin user - password will be hashed automatically by User model pre-save hook
      const newAdmin = await User.create({
        ...adminUser,
        password: adminUser.password,
      });

      console.log(`  ✅ Created: ${adminUser.email} (role: admin)`);
    }

    // ==================== SUMMARY ====================
    console.log('\n📊 Database Seed Summary:');
    const charityCount = await Charity.countDocuments();
    const userCount = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });

    console.log(`  📚 Total Charities: ${charityCount}`);
    console.log(`  👥 Total Users: ${userCount}`);
    console.log(`  🔐 Admin Users: ${adminCount}`);

    console.log(
      '\n✨ Database seed completed successfully!'
    );
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    if (error.details) {
      console.error('   Details:', error.details);
    }
    process.exit(1);
  }
}

// Run seed
seedDatabase();
