'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Mail, Lock, AlertCircle, User, Heart, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const [step, setStep] = useState(1); // 1: account, 2: charity
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    charityId: null,
  });
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const router = useRouter();

  // Fetch charities
  useEffect(() => {
    const fetchCharities = async () => {
      try {
        const res = await fetch('/api/charities?limit=12');
        if (res.ok) {
          const data = await res.json();
          setCharities(data.data.charities || []);
        }
      } catch (error) {
        console.error('Error fetching charities:', error);
      }
    };
    if (step === 2) {
      fetchCharities();
    }
  }, [step]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStepOne = (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the terms and conditions.');
      return;
    }

    setStep(2);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create account
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      if (!signupRes.ok) {
        const data = await signupRes.json();
        setError(data.message || 'Signup failed. Email may already be registered.');
        setLoading(false);
        return;
      }

      // 2. Select charity if chosen
      if (formData.charityId) {
        const charityRes = await fetch('/api/charities/select', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            charityId: formData.charityId,
            charityContributionPercent: 100, // Default to 100%
          }),
        });

        if (!charityRes.ok) {
          console.error('Failed to select charity, but account created');
        }
      }

      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
      {/* Background accents */}
      <div className="absolute -right-40 top-20 h-80 w-80 rounded-full bg-gradient-to-l from-blue-600/20 to-transparent blur-3xl"></div>
      <div className="absolute -left-40 bottom-20 h-80 w-80 rounded-full bg-gradient-to-r from-cyan-600/20 to-transparent blur-3xl"></div>

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-white">
              {step === 1 ? 'Create Your Account' : 'Choose Your Cause'}
            </h1>
            <p className="text-slate-400">
              {step === 1
                ? 'Join our community of impact-driven players'
                : 'Select a charity that matters to you'}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="mb-8 flex gap-4">
            {[1, 2].map((s) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all ${
                    s === step
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                      : s < step
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 2 && (
                  <div
                    className={`h-1 flex-1 rounded-full ${
                      s < step ? 'bg-green-600' : 'bg-slate-800'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <form
            onSubmit={step === 1 ? handleStepOne : handleSignup}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur sm:p-10"
          >
            {/* Error Alert */}
            {error && (
              <div className="mb-6 flex gap-3 rounded-lg bg-red-600/10 p-4 ring-1 ring-red-600/20">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Step 1: Account Creation */}
            {step === 1 ? (
              <>
                {/* First Name */}
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-white">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      required
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-3 pl-12 pr-4 text-white placeholder-slate-500 transition-all focus:border-blue-600 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-white">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      required
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-3 pl-12 pr-4 text-white placeholder-slate-500 transition-all focus:border-blue-600 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-white">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="you@example.com"
                      required
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-3 pl-12 pr-4 text-white placeholder-slate-500 transition-all focus:border-blue-600 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-white">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-3 pl-12 pr-4 text-white placeholder-slate-500 transition-all focus:border-blue-600 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-white">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-3 pl-12 pr-4 text-white placeholder-slate-500 transition-all focus:border-blue-600 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="mb-8 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-800 text-blue-600"
                  />
                  <label htmlFor="terms" className="text-sm text-slate-300">
                    I agree to the{' '}
                    <a href="#" className="text-blue-400 hover:text-blue-300">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-blue-400 hover:text-blue-300">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                {/* Next Button */}
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 py-3 font-bold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25"
                >
                  Continue <ArrowRight size={18} />
                </button>
              </>
            ) : (
              /* Step 2: Charity Selection */
              <>
                <p className="mb-6 text-sm text-slate-300">
                  You can change this later in your dashboard.
                </p>

                {/* Charity Grid */}
                <div className="mb-8 max-h-96 space-y-3 overflow-y-auto">
                  {charities.map((charity) => (
                    <button
                      key={charity._id}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, charityId: charity._id }))
                      }
                      className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                        formData.charityId === charity._id
                          ? 'border-blue-600 bg-blue-600/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-white">{charity.name}</h3>
                          <p className="text-xs text-slate-400">{charity.category}</p>
                        </div>
                        {formData.charityId === charity._id && (
                          <CheckCircle2 size={20} className="text-blue-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-lg border border-slate-700 py-3 font-bold text-white transition-all hover:bg-slate-800"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 py-3 font-bold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </>
            )}

            {/* Divider */}
            {step === 1 && (
              <>
                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-700"></div>
                  <p className="text-xs text-slate-500">OR</p>
                  <div className="h-px flex-1 bg-slate-700"></div>
                </div>

                {/* Login Link */}
                <p className="text-center text-sm text-slate-400">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="font-semibold text-blue-400 transition-colors hover:text-blue-300"
                  >
                    Log in here
                  </Link>
                </p>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
