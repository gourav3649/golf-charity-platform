import { jsonResponse } from '@/middleware/authMiddleware';

/**
 * GET /api/subscriptions/plans
 * Get available subscription plans with pricing
 * Public route (no authentication required)
 */
export async function GET(request) {
  try {
    const plans = {
      monthly: {
        id: 'monthly',
        name: 'Monthly Plan',
        description: 'Flexible month-to-month subscription',
        price: 9.99,
        currency: 'USD',
        billingCycle: 'monthly',
        duration: 30, // days
        features: [
          'Enter 5 latest golf scores',
          'Participate in monthly draws',
          'Support charity of choice (min 10%)',
          'View winnings and draw results',
          'Upload winner proof',
        ],
        renewalMessage: 'Renews every 30 days',
      },
      yearly: {
        id: 'yearly',
        name: 'Yearly Plan',
        description: 'Best value - save 20% with annual commitment',
        price: 95.88, // $9.99/month × 12 × 0.8 (20% discount)
        monthlyEquivalent: 7.99,
        currency: 'USD',
        billingCycle: 'yearly',
        duration: 365, // days
        savingsAmount: 19.92, // $9.99 × 2 months
        savingsPercent: 20,
        features: [
          'Enter 5 latest golf scores',
          'Participate in monthly draws',
          'Support charity of choice (min 10%)',
          'View winnings and draw results',
          'Upload winner proof',
          '20% annual savings',
        ],
        renewalMessage: 'Renews every 365 days',
      },
    };

    return jsonResponse(
      {
        success: true,
        message: 'Subscription plans retrieved',
        data: {
          plans,
          description: 'Choose a plan that works best for you. All plans include full access to the platform.',
        },
      },
      200
    );
  } catch (error) {
    console.error('Get plans error:', error);
    return jsonResponse(
      {
        success: false,
        message: 'Error fetching subscription plans',
        error: error.message,
      },
      500
    );
  }
}
