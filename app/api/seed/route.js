import mongoose from 'mongoose';
import User from '@/models/User';
import Charity from '@/models/Charity';
import connectDB from '@/lib/mongodb';

const SEED_SECRET = 'SEED_SECRET_2024';

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
    renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    charityId: null,
    contributionPercent: 0,
  },
};

export async function GET(request) {
  try {
    // Extract secret from query params
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Validate secret
    if (!secret || secret !== SEED_SECRET) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid or missing secret key',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Connect to database
    await connectDB();

    const results = {
      charities: {
        created: 0,
        skipped: 0,
        list: [],
      },
      users: {
        created: 0,
        skipped: 0,
      },
    };

    // Seed charities
    for (const charity of charities) {
      const existingCharity = await Charity.findOne({ name: charity.name });

      if (existingCharity) {
        results.charities.skipped++;
      } else {
        await Charity.create(charity);
        results.charities.created++;
        results.charities.list.push(
          `${charity.name}${charity.featured ? ' (Featured)' : ''}`
        );
      }
    }

    // Seed admin user
    const existingAdmin = await User.findOne({ email: adminUser.email });

    if (existingAdmin) {
      results.users.skipped++;
    } else {
      await User.create({
        ...adminUser,
        password: adminUser.password,
      });
      results.users.created++;
    }

    // Get final counts
    const totalCharities = await Charity.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database seeded successfully',
        seeded: {
          charities: {
            created: results.charities.created,
            skipped: results.charities.skipped,
            list: results.charities.list,
          },
          users: {
            created: results.users.created,
            skipped: results.users.skipped,
            adminCreated: results.users.created > 0,
          },
        },
        summary: {
          totalCharities,
          totalUsers,
          totalAdmins,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Seed endpoint error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to seed database',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
