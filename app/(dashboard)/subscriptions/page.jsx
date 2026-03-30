'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, Check, Loader2, AlertCircle, Heart, ArrowRight } from 'lucide-react';

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [charities, setCharities] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedCharity, setSelectedCharity] = useState(null);
  const [contributionPercent, setContributionPercent] = useState(100);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: plans, 2: charity
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch plans
        const plansRes = await fetch('/api/subscriptions/plans');
        if (plansRes.ok) {
          const plansData = await plansRes.json();
          setPlans(plansData.data.plans);
        }

        // Fetch subscription status
        const subRes = await fetch('/api/subscriptions/status');
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscription(subData.data.subscription);
        }

        // Fetch charities
        const charRes = await fetch('/api/charities?limit=20');
        if (charRes.ok) {
          const charData = await charRes.json();
          setCharities(charData.data.charities || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleActivateSubscription = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Activate subscription
      const subRes = await fetch('/api/subscriptions/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      if (!subRes.ok) {
        const data = await subRes.json();
        setError(data.message || 'Failed to activate subscription');
        setSubmitting(false);
        return;
      }

      const subData = await subRes.json();

      // If charity selected, update it
      if (selectedCharity) {
        const charRes = await fetch('/api/charities/select', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            charityId: selectedCharity,
            contributionPercent: contributionPercent,
          }),
        });

        if (!charRes.ok) {
          console.error('Failed to select charity, but subscription activated');
        }
      }

      // Go to step 2 to select charity
      setSubscription(subData.data.subscription);
      setStep(2);
    } catch (err) {
      setError('An error occurred while activating subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectCharity = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const charRes = await fetch('/api/charities/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          charityId: selectedCharity,
          contributionPercent: contributionPercent,
        }),
      });

      if (!charRes.ok) {
        const data = await charRes.json();
        setError(data.message || 'Failed to select charity');
        setSubmitting(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('An error occurred while selecting charity');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 h-10 w-32 animate-pulse rounded-lg bg-slate-800"></div>
          <div className="grid gap-6 sm:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-lg bg-slate-800"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show steps if activating subscription
  if (subscription?.status !== 'active' && step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="mb-2 text-4xl font-bold text-white">Choose Your Plan</h1>
            <p className="text-slate-400">
              Subscribe to participate in monthly draws and support causes you love
            </p>
          </div>

          {error && (
            <div className="mb-8 flex gap-3 rounded-lg bg-red-600/10 p-4 ring-1 ring-red-600/20">
              <AlertCircle size={16} className="flex-shrink-0 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Plans Grid */}
          {plans ? (
            <form onSubmit={handleActivateSubscription} className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                {Object.entries(plans).map(([key, plan]) => (
                  <div
                    key={key}
                    onClick={() => setSelectedPlan(key)}
                    className={`cursor-pointer rounded-xl border-2 p-8 transition-all ${
                      selectedPlan === key
                        ? 'border-blue-600 bg-blue-600/10 ring-2 ring-blue-600/30'
                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                    }`}
                  >
                    <h3 className="mb-2 text-2xl font-bold text-white">{plan.name}</h3>
                    <p className="mb-4 text-sm text-slate-400">{plan.description}</p>

                    <div className="mb-6">
                      <p className="text-4xl font-bold text-white">
                        ${plan.price}
                        <span className="text-lg text-slate-400">/year</span>
                      </p>
                      {plan.monthlyEquivalent && (
                        <p className="text-sm text-cyan-400">
                          Only ${plan.monthlyEquivalent}/month
                        </p>
                      )}
                    </div>

                    {plan.savingsPercent && (
                      <div className="mb-6 rounded-lg bg-green-600/20 px-4 py-2">
                        <p className="text-sm font-semibold text-green-300">
                          Save {plan.savingsPercent}% • ${plan.savingsAmount}
                        </p>
                      </div>
                    )}

                    <ul className="mb-6 space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                          <Check size={16} className="mt-1 flex-shrink-0 text-green-400" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="rounded-lg bg-slate-800/50 p-3">
                      <p className="text-xs text-slate-400">{plan.renewalMessage}</p>
                    </div>

                    {selectedPlan === key && (
                      <div className="mt-4 rounded-lg bg-blue-600/30 p-3">
                        <p className="text-sm font-semibold text-blue-300">Selected</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={!selectedPlan || submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 py-4 font-bold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    Continue <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="rounded-lg bg-slate-900/50 p-12 text-center">
              <p className="text-slate-400">Unable to load plans. Please try again later.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show charity selection
  if ((subscription?.status !== 'active' && step === 2) || step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="mb-2 text-4xl font-bold text-white">
              {subscription?.status === 'active' ? 'Update Your' : 'Select Your'} Charity
            </h1>
            <p className="text-slate-400">
              Choose a cause and decide how much of your subscription goes to support it
            </p>
          </div>

          {error && (
            <div className="mb-8 flex gap-3 rounded-lg bg-red-600/10 p-4 ring-1 ring-red-600/20">
              <AlertCircle size={16} className="flex-shrink-0 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSelectCharity} className="space-y-8">
            {/* Charities Grid */}
            <div>
              <h2 className="mb-4 font-bold text-white">Available Charities</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {charities.map((charity) => (
                  <button
                    key={charity._id}
                    type="button"
                    onClick={() => setSelectedCharity(charity._id)}
                    className={`rounded-xl border-2 p-6 text-left transition-all ${
                      selectedCharity === charity._id
                        ? 'border-red-600 bg-red-600/10 ring-2 ring-red-600/30'
                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-white">{charity.name}</h3>
                        <p className="text-xs text-slate-400">{charity.category}</p>
                      </div>
                      {selectedCharity === charity._id && (
                        <Check size={20} className="text-red-400" />
                      )}
                    </div>
                    {charity.description && (
                      <p className="mt-3 text-xs text-slate-400">{charity.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Contribution Percentage */}
            {selectedCharity && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <h2 className="mb-4 font-bold text-white">Contribution Amount</h2>

                <div className="mb-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-white">
                      Percentage of Subscription (%)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="10"
                      value={contributionPercent}
                      onChange={(e) => setContributionPercent(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <p className="mt-2 text-center text-2xl font-bold text-red-400">
                      {contributionPercent}%
                    </p>
                  </div>

                  {subscription?.plan && (
                    <div className="rounded-lg bg-slate-800/50 p-4">
                      <p className="text-xs text-slate-400">Monthly contribution amount:</p>
                      <p className="text-2xl font-bold text-green-400">
                        $
                        {(() => {
                          const planAmount = subscription?.plan === 'yearly' ? 95.88 : 9.99;
                          return (planAmount * contributionPercent / 100).toFixed(2);
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row">
              {subscription?.status === 'active' ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex-1 rounded-lg border border-slate-700 py-4 text-center font-bold text-white transition-colors hover:bg-slate-800"
                  >
                    Skip
                  </Link>
                  <button
                    type="submit"
                    disabled={!selectedCharity || submitting}
                    className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 py-4 font-bold text-white transition-all hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Updating...
                      </>
                    ) : (
                      'Update Charity'
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={!selectedCharity || submitting}
                  className="w-full rounded-lg bg-gradient-to-r from-red-600 to-pink-600 py-4 font-bold text-white transition-all hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Processing...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Show active subscription management
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 px-4 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="mb-2 text-4xl font-bold text-white">Your Subscription</h1>
          <p className="text-slate-400">Manage your active subscription and charity selection</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Current Subscription */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8">
            <div className="mb-6 flex items-center gap-3">
              <CreditCard className="text-blue-400" size={24} />
              <h2 className="text-2xl font-bold text-white">Current Plan</h2>
            </div>

            {subscription && (
              <>
                <div className="mb-8 space-y-4">
                  <div>
                    <p className="text-sm text-slate-400">Plan Type</p>
                    <p className="text-2xl font-bold text-white capitalize">
                      {subscription.plan || 'None'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-800/50 p-4">
                    <p className="text-sm text-slate-400">Monthly Amount</p>
                    <p className="text-2xl font-bold text-green-400">
                      ${subscription?.subscription?.amount || '0.00'}
                    </p>
                  </div>

                  {subscription.daysUntilRenewal && (
                    <div>
                      <p className="text-sm text-slate-400">Days Until Renewal</p>
                      <p className="text-xl font-bold text-white">
                        {subscription.daysUntilRenewal} days
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={async () => {
                    await fetch('/api/subscriptions/cancel', { method: 'POST' });
                    router.refresh();
                  }}
                  className="w-full rounded-lg bg-red-600/20 px-4 py-3 font-bold text-red-300 transition-colors hover:bg-red-600/30"
                >
                  Cancel Subscription
                </button>
              </>
            )}
          </div>

          {/* Selected Charity */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8">
            <div className="mb-6 flex items-center gap-3">
              <Heart className="text-red-400" size={24} />
              <h2 className="text-2xl font-bold text-white">Selected Charity</h2>
            </div>

            {subscription?.selectedCharity ? (
              <>
                <div className="mb-8 space-y-4">
                  <div>
                    <p className="text-sm text-slate-400">Charity</p>
                    <p className="text-lg font-bold text-white">
                      {subscription.selectedCharity.name}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-800/50 p-4">
                    <p className="text-sm text-slate-400">Contribution Rate</p>
                    <p className="text-2xl font-bold text-red-400">
                      {subscription.charityContributionPercent}%
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-800/50 p-4">
                    <p className="text-sm text-slate-400">Monthly Contribution</p>
                    <p className="text-2xl font-bold text-green-400">
                      $
                      {(() => {
                        const planAmount = subscription?.plan === 'yearly' ? 95.88 : 9.99;
                        return (planAmount * (subscription?.charityContributionPercent || 100) / 100).toFixed(2);
                      })()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full rounded-lg bg-slate-800 px-4 py-3 font-bold text-white transition-colors hover:bg-slate-700"
                >
                  Change Charity
                </button>
              </>
            ) : (
              <>
                <p className="mb-6 text-slate-400">No charity selected yet.</p>
                <button
                  onClick={() => setStep(2)}
                  className="w-full rounded-lg bg-gradient-to-r from-red-600 to-pink-600 px-4 py-3 font-bold text-white transition-all hover:shadow-lg hover:shadow-red-500/25"
                >
                  Select a Charity
                </button>
              </>
            )}
          </div>
        </div>

        {/* Available Plans */}
        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-bold text-white">Change Your Plan</h2>
          {plans && (
            <div className="grid gap-6 sm:grid-cols-2">
              {Object.entries(plans).map(([key, plan]) => (
                <div
                  key={key}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-6"
                >
                  <h3 className="mb-2 text-xl font-bold text-white">{plan.name}</h3>
                  <p className="mb-4 text-2xl font-bold text-white">
                    ${plan.price}
                    <span className="text-sm text-slate-400">/year</span>
                  </p>
                  <p className="text-sm text-slate-400">{plan.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
