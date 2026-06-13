import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Charity from '@/models/Charity';
import Draw from '@/models/Draw';
import Donation from '@/models/Donation';
import mongoose from 'mongoose';
import { withAdmin, errorResponse, jsonResponse } from '@/middleware/authMiddleware';

/**
 * GET /api/admin/analytics
 * Get platform analytics (admin only)
 */
async function handleGET(request) {
  try {
    await connectDB();

    // 1. User Statistics
    const totalUsers = await User.countDocuments();
    const activeSubscribers = await User.countDocuments({
      'subscription.status': 'active',
    });
    const cancelledSubscriptions = await User.countDocuments({
      'subscription.status': 'cancelled',
    });
    const lapsedSubscriptions = await User.countDocuments({
      'subscription.status': 'lapsed',
    });

    // 2. Subscription Revenue
    const subscriptionStats = await User.aggregate([
      {
        $group: {
          _id: '$subscription.status',
          count: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$subscription.status', 'active'] },
                { $ifNull: ['$subscription.amount', 0] },
                0,
              ],
            },
          },
        },
      },
    ]);

    let totalMonthlyRevenue = 0;
    const revenueBreakdown = {};
    subscriptionStats.forEach(stat => {
      revenueBreakdown[stat._id] = {
        count: stat.count,
        revenue: stat.totalRevenue,
      };
      if (stat._id === 'active') {
        totalMonthlyRevenue = stat.totalRevenue;
      }
    });

    // 3. Charity Statistics
    const charities = await Charity.find().select('name category totalRaised activeSubscribers');
    const totalCharities = charities.length;
    const totalCharityRaised = charities.reduce((sum, c) => sum + c.totalRaised, 0);

    // Charity breakdown by top 5 by raised amount
    const topCharitiesByRaised = charities
      .sort((a, b) => b.totalRaised - a.totalRaised)
      .slice(0, 5)
      .map(c => ({
        id: c._id,
        name: c.name,
        category: c.category,
        totalRaised: parseFloat(c.totalRaised.toFixed(2)),
        activeSubscribers: c.activeSubscribers,
      }));

    // 4. Donation Statistics
    const donations = await Donation.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
        },
      },
    ]);

    let totalDonations = 0;
    let totalDonationAmount = 0;
    const donationBreakdown = {};
    donations.forEach(d => {
      donationBreakdown[d._id] = {
        count: d.count,
        totalAmount: parseFloat(d.totalAmount.toFixed(2)),
        averageAmount: parseFloat(d.averageAmount.toFixed(2)),
      };
      totalDonations += d.count;
      totalDonationAmount += d.totalAmount;
    });

    // 5. Draw Statistics
    const totalDraws = await Draw.countDocuments();
    const publishedDraws = await Draw.countDocuments({ status: 'published' });
    const pendingDraws = await Draw.countDocuments({ status: 'pending' });
    const simulatedDraws = await Draw.countDocuments({ status: 'simulated' });

    // Prize pool statistics from all published draws
    const drawStats = await Draw.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: null,
          totalPrizePoolAmount: {
            $sum: {
              $add: [
                { $ifNull: ['$prizePool.fiveMatch.amount', 0] },
                { $ifNull: ['$prizePool.fourMatch.amount', 0] },
                { $ifNull: ['$prizePool.threeMatch.amount', 0] },
              ],
            },
          },
          totalRolloverAmount: { $sum: { $ifNull: ['$rolloverAmount', 0] } },
          averagePrizePool: {
            $avg: {
              $add: [
                { $ifNull: ['$prizePool.fiveMatch.amount', 0] },
                { $ifNull: ['$prizePool.fourMatch.amount', 0] },
                { $ifNull: ['$prizePool.threeMatch.amount', 0] },
              ],
            },
          },
        },
      },
    ]);

    let totalPrizePool = 0;
    let totalRollover = 0;
    let averagePrizePool = 0;
    if (drawStats.length > 0) {
      totalPrizePool = drawStats[0].totalPrizePoolAmount || 0;
      totalRollover = drawStats[0].totalRolloverAmount || 0;
      averagePrizePool = drawStats[0].averagePrizePool || 0;
    }

    // Winners statistics
    const winnerStats = await Draw.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$winners' },
      {
        $group: {
          _id: '$winners.matchType',
          count: { $sum: 1 },
          totalPriceAmount: { $sum: '$winners.prizeAmount' },
          paidWinners: {
            $sum: {
              $cond: [
                { $eq: ['$winners.verificationStatus', 'paid'] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const totalWinners = await Draw.aggregate([
      { $unwind: '$winners' },
      {
        $group: {
          _id: null,
          totalWinners: { $sum: 1 },
          paidWinners: {
            $sum: {
              $cond: [
                { $eq: ['$winners.verificationStatus', 'paid'] },
                1,
                0,
              ],
            },
          },
          approvedWinners: {
            $sum: {
              $cond: [
                { $in: ['$winners.verificationStatus', ['approved', 'paid']] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const totalWinnerCount = totalWinners.length > 0 ? totalWinners[0].totalWinners : 0;
    const paidWinnerCount = totalWinners.length > 0 ? totalWinners[0].paidWinners : 0;
    const approvedWinnerCount = totalWinners.length > 0 ? totalWinners[0].approvedWinners : 0;

    // 6. Golf Score Statistics
    const scoreStats = await mongoose.connection.collection('golfscores')
      .aggregate([
        {
          $group: {
            _id: null,
            totalScores: {
              $sum: { $size: '$scores' },
            },
            averageScoreValue: {
              $avg: {
                $avg: '$scores.value',
              },
            },
            usersWithScores: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const totalScores = scoreStats.length > 0 ? scoreStats[0].totalScores : 0;
    const averageScoreValue = scoreStats.length > 0 ? scoreStats[0].averageScoreValue : 0;
    const usersWithScores = scoreStats.length > 0 ? scoreStats[0].usersWithScores : 0;

    return jsonResponse(
      {
        success: true,
        data: {
          timestamp: new Date(),
          overview: {
            totalUsers,
            activeSubscribers,
            totalCharities,
            totalDraws: publishedDraws,
          },
          subscriptions: {
            totalActiveSubscribers: activeSubscribers,
            cancelledCount: cancelledSubscriptions,
            lapsedCount: lapsedSubscriptions,
            monthlyRevenue: parseFloat(totalMonthlyRevenue.toFixed(2)),
            breakdown: revenueBreakdown,
          },
          charities: {
            totalCharities,
            totalRaised: parseFloat(totalCharityRaised.toFixed(2)),
            averagePerCharity: totalCharities > 0 ? parseFloat((totalCharityRaised / totalCharities).toFixed(2)) : 0,
            topCharitiesByRaised,
          },
          donations: {
            totalDonations,
            totalAmount: parseFloat(totalDonationAmount.toFixed(2)),
            breakdown: donationBreakdown,
          },
          draws: {
            total: totalDraws,
            published: publishedDraws,
            simulated: simulatedDraws,
            pending: pendingDraws,
            totalPrizePool: parseFloat(totalPrizePool.toFixed(2)),
            totalRollover: parseFloat(totalRollover.toFixed(2)),
            averagePrizePool: parseFloat(averagePrizePool.toFixed(2)),
          },
          winners: {
            totalWinners: totalWinnerCount,
            approved: approvedWinnerCount,
            paid: paidWinnerCount,
            pending: totalWinnerCount - approvedWinnerCount,
            byMatchType: winnerStats.map(w => ({
              matchType: w._id,
              count: w.count,
              totalPrizeAmount: parseFloat(w.totalPriceAmount.toFixed(2)),
              paidWinners: w.paidWinners,
            })),
          },
          golfScores: {
            totalScores,
            usersWithScores,
            averageScoreValue: parseFloat(averageScoreValue.toFixed(2)),
          },
        },
      },
      200
    );
  } catch (error) {
    console.error('Get analytics error:', error);
    return errorResponse(
      error.message || 'Error fetching analytics',
      500,
      { error: error.message }
    );
  }
}

export const GET = withAdmin(handleGET);
