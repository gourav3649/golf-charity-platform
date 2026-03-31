'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, Check, Loader2, AlertCircle, Heart, ArrowRight } from 'lucide-react';

function SubscriptionsPage() {
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
  const searchParams = useSearchParams();

  // Handle step parameter from URL
  useEffect(() => {
    if (searchParams.get('step') === 'charity') {
      setStep(2);
    }
  }, [searchParams]);

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
    e?.preventDefault?.();
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
    e?.preventDefault?.();
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
      <div className="min-h-screen bg-brand-bg px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 h-10 w-32 animate-pulse rounded-lg bg-gray-300"></div>
          <div className="grid gap-6 sm:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-lg bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show steps if activating subscription
  if (subscription?.subscription?.status !== 'active' && step === 1) {
    return (
      <div className="min-h-screen bg-brand-bg px-4 py-12">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-4xl font-bold text-brand-green">Choose Your Plan</h1>
              <p className="text-brand-text-muted">
                Subscribe to participate in monthly draws and support causes you love
              </p>
            </div>
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.push('/');
                router.refresh();
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Logout
            </button>
          </div>

          {error && (
            <div className="mb-8 flex gap-3 rounded-lg bg-red-50 p-4 ring-1 ring-red-200">
              <AlertCircle size={16} className="flex-shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
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
                        ? 'border-brand-gold bg-brand-gold/10 ring-2 ring-brand-gold/30'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <h3 className="mb-2 text-2xl font-bold text-brand-green">{plan.name}</h3>
                    <p className="mb-4 text-sm text-brand-text-muted">{plan.description}</p>

                    <div className="mb-6">
                      <p className="text-4xl font-bold text-brand-green">
                        ${plan.price}
                        <span className="text-lg text-brand-text-muted">{key === 'monthly' ? '/month' : '/year'}</span>
                      </p>
                      {plan.monthlyEquivalent && (
                        <p className="text-sm text-brand-gold">
                          Only ${plan.monthlyEquivalent}/month
                        </p>
                      )}
                    </div>

                    {plan.savingsPercent && (
                      <div className="mb-6 rounded-lg bg-brand-green/10 px-4 py-2">
                        <p className="text-sm font-semibold text-brand-green">
                          Save {plan.savingsPercent}% • ${plan.savingsAmount}
                        </p>
                      </div>
                    )}

                    <ul className="mb-6 space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-brand-text-muted">
                          <Check size={16} className="mt-1 flex-shrink-0 text-brand-green" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="rounded-lg bg-brand-bg p-3">
                      <p className="text-xs text-brand-text-muted">{plan.renewalMessage}</p>
                    </div>

                    {selectedPlan === key && (
                      <div className="mt-4 rounded-lg bg-brand-gold/20 p-3">
                        <p className="text-sm font-semibold text-brand-gold">Selected</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={!selectedPlan || submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-gold py-4 font-bold text-white transition-all hover:bg-brand-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="rounded-lg bg-white p-12 text-center">
              <p className="text-brand-text-muted">Unable to load plans. Please try again later.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show charity selection
  if ((subscription?.status !== 'active' && step === 2) || step === 2) {
    return (
      <div className="min-h-screen bg-brand-bg px-4 py-12">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-4xl font-bold text-brand-green">
                {subscription?.status === 'active' ? 'Update Your' : 'Select Your'} Charity
              </h1>
              <p className="text-brand-text-muted">
                Choose a cause and decide how much of your subscription goes to support it
              </p>
            </div>
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.push('/');
                router.refresh();
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Logout
            </button>
          </div>

          {error && (
            <div className="mb-8 flex gap-3 rounded-lg bg-red-50 p-4 ring-1 ring-red-200">
              <AlertCircle size={16} className="flex-shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSelectCharity} className="space-y-8">
            {/* Charities Grid */}
            <div>
              <h2 className="mb-4 font-bold text-brand-green">Available Charities</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {charities.map((charity) => (
                  <button
                    key={charity._id}
                    type="button"
                    onClick={() => setSelectedCharity(charity._id)}
                    className={`rounded-xl border-2 p-6 text-left transition-all ${
                      selectedCharity === charity._id
                        ? 'border-brand-gold bg-brand-gold/10 ring-2 ring-brand-gold/30'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-brand-green">{charity.name}</h3>
                        <p className="text-xs text-brand-text-muted">{charity.category}</p>
                      </div>
                      {selectedCharity === charity._id && (
                        <Check size={20} className="text-brand-gold" />
                      )}
                    </div>
                    {charity.description && (
                      <p className="mt-3 text-xs text-brand-text-muted">{charity.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Contribution Percentage */}
            {selectedCharity && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 font-bold text-brand-green">Contribution Amount</h2>

                <div className="mb-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-brand-green">
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
                    <p className="mt-2 text-center text-2xl font-bold text-brand-gold">
                      {contributionPercent}%
                    </p>
                  </div>

                  {subscription?.plan && (
                    <div className="rounded-lg bg-brand-bg p-4">
                      <p className="text-xs text-brand-text-muted">Monthly contribution amount:</p>
                      <p className="text-2xl font-bold text-brand-gold">
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
                    className="flex-1 rounded-lg border border-brand-green text-brand-green py-4 text-center font-bold transition-colors hover:bg-brand-green/10"
                  >
                    Skip
                  </Link>
                  <button
                    type="submit"
                    disabled={!selectedCharity || submitting}
                    className="flex-1 rounded-lg bg-brand-gold py-4 font-bold text-white transition-all hover:bg-brand-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="w-full rounded-lg bg-brand-gold py-4 font-bold text-white transition-all hover:bg-brand-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="min-h-screen bg-brand-bg px-4 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-brand-green">Your Subscription</h1>
            <p className="text-brand-text-muted">Manage your active subscription and charity selection</p>
          </div>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/');
              router.refresh();
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Current Subscription */}
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <CreditCard className="text-brand-gold" size={24} />
              <h2 className="text-2xl font-bold text-brand-green">Current Plan</h2>
            </div>

            {subscription && (
              <>
                <div className="mb-8 space-y-4">
                  <div>
                    <p className="text-sm text-brand-text-muted">Plan Type</p>
                    <p className="text-2xl font-bold text-brand-green capitalize">
                      {subscription.plan || 'None'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-brand-bg p-4">
                    <p className="text-sm text-brand-text-muted">Monthly Amount</p>
                    <p className="text-2xl font-bold text-brand-gold">
                      ${subscription?.subscription?.amount || '0.00'}
                    </p>
                  </div>

                  {subscription.daysUntilRenewal && (
                    <div>
                      <p className="text-sm text-brand-text-muted">Days Until Renewal</p>
                      <p className="text-xl font-bold text-brand-green">
                        {subscription.daysUntilRenewal} days
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={async () => {
                    await fetch('/api/subscriptions/cancel', { method: 'POST' });
                    window.location.reload();
                  }}
                  className="w-full rounded-lg bg-red-600 px-4 py-3 font-bold text-white transition-colors hover:bg-red-700"
                >
                  Cancel Subscription
                </button>
              </>
            )}
          </div>

          {/* Selected Charity */}
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <Heart className="text-brand-gold" size={24} />
              <h2 className="text-2xl font-bold text-brand-green">Selected Charity</h2>
            </div>

            {subscription?.selectedCharity ? (
              <>
                <div className="mb-8 space-y-4">
                  <div>
                    <p className="text-sm text-brand-text-muted">Charity</p>
                    <p className="text-lg font-bold text-brand-green">
                      {subscription.selectedCharity.name}
                    </p>
                  </div>

                  <div className="rounded-lg bg-brand-bg p-4">
                    <p className="text-sm text-brand-text-muted">Contribution Rate</p>
                    <p className="text-2xl font-bold text-brand-gold">
                      {subscription.charityContributionPercent}%
                    </p>
                  </div>

                  <div className="rounded-lg bg-brand-bg p-4">
                    <p className="text-sm text-brand-text-muted">Monthly Contribution</p>
                    <p className="text-2xl font-bold text-brand-gold">
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
                  className="w-full rounded-lg border border-brand-green text-brand-green px-4 py-3 font-bold transition-colors hover:bg-brand-green/10"
                >
                  Change Charity
                </button>
              </>
            ) : (
              <>
                <p className="mb-6 text-brand-text-muted">No charity selected yet.</p>
                <button
                  onClick={() => setStep(2)}
                  className="w-full rounded-lg bg-brand-gold px-4 py-3 font-bold text-white transition-all hover:bg-brand-gold/90"
                >
                  Select a Charity
                </button>
              </>
            )}
          </div>
        </div>

        {/* Available Plans */}
        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-bold text-brand-green">Change Your Plan</h2>
          {plans && (
            <div className="grid gap-6 sm:grid-cols-2">
              {Object.entries(plans).map(([key, plan]) => (
                <div
                  key={key}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="mb-2 text-xl font-bold text-brand-green">{plan.name}</h3>
                  <p className="mb-4 text-2xl font-bold text-brand-green">
                    ${plan.price}
                    <span className="text-sm text-brand-text-muted">{key === 'monthly' ? '/month' : '/year'}</span>
                  </p>
                  <p className="text-sm text-brand-text-muted">{plan.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SubscriptionsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-bg px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-300 mb-8"></div>
          <div className="h-80 animate-pulse rounded-lg bg-gray-200"></div>
        </div>
      </div>
    }>
      <SubscriptionsPage />
    </Suspense>
  );
}

export default SubscriptionsPageWrapper;
