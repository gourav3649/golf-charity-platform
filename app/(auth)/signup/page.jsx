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

  const handleStepOne = async (e) => {
    e?.preventDefault?.();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Please enter your full name.');
      setLoading(false);
      return;
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the terms and conditions.');
      setLoading(false);
      return;
    }

    // Create account
    try {
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
        if (signupRes.status === 409) {
          setError('Email already registered. Please use a different email or log in.');
        } else {
          setError(data.message || 'Signup failed. Please try again.');
        }
        setLoading(false);
        return;
      }

      setStep(2);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e?.preventDefault?.();
    setError('');
    setLoading(true);

    try {
      // Select charity if chosen
      if (formData.charityId) {
        const charityRes = await fetch('/api/charities/select', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            charityId: formData.charityId,
            contributionPercent: 10,
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
    <div className="min-h-screen bg-brand-bg">
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-brand-green">
              {step === 1 ? 'Create Your Account' : 'Choose Your Cause'}
            </h1>
            <p className="text-brand-text-muted">
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
                      ? 'bg-brand-gold text-white'
                      : s < step
                      ? 'bg-brand-green text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 2 && (
                  <div
                    className={`h-1 flex-1 rounded-full ${
                      s < step ? 'bg-brand-green' : 'bg-gray-300'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <form
            onSubmit={step === 1 ? handleStepOne : handleSignup}
            className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10"
          >
            {/* Error Alert */}
            {error && (
              <div className="mb-6 flex gap-3 rounded-lg bg-red-50 p-4 ring-1 ring-red-200">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Step 1: Account Creation */}
            {step === 1 ? (
              <>
                {/* First Name */}
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-brand-green">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-12 pr-4 text-brand-text placeholder-gray-400 transition-all focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-brand-green">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-12 pr-4 text-brand-text placeholder-gray-400 transition-all focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-brand-green">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="you@example.com"
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-12 pr-4 text-brand-text placeholder-gray-400 transition-all focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-brand-green">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-12 pr-4 text-brand-text placeholder-gray-400 transition-all focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-brand-green">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-12 pr-4 text-brand-text placeholder-gray-400 transition-all focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20"
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
                    className="mt-1 h-5 w-5 rounded border-gray-300 bg-white text-brand-gold"
                  />
                  <label htmlFor="terms" className="text-sm text-brand-text">
                    I agree to the{' '}
                    <a href="#" className="text-brand-green hover:text-brand-green/80">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-brand-green hover:text-brand-green/80">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                {/* Next Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-gold py-3 font-bold text-white transition-all hover:bg-brand-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Continue'} {!loading && <ArrowRight size={18} />}
                </button>
              </>
            ) : (
              /* Step 2: Charity Selection */
              <>
                <p className="mb-6 text-sm text-brand-text-muted">
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
                          ? 'border-brand-gold bg-brand-gold/10'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-brand-green">{charity.name}</h3>
                          <p className="text-xs text-brand-text-muted">{charity.category}</p>
                        </div>
                        {formData.charityId === charity._id && (
                          <CheckCircle2 size={20} className="text-brand-gold" />
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
                    className="flex-1 rounded-lg border border-brand-green text-brand-green py-3 font-bold transition-all hover:bg-brand-green/10"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-lg bg-brand-gold py-3 font-bold text-white transition-all hover:bg-brand-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="h-px flex-1 bg-gray-300"></div>
                  <p className="text-xs text-gray-500">OR</p>
                  <div className="h-px flex-1 bg-gray-300"></div>
                </div>

                {/* Login Link */}
                <p className="text-center text-sm text-brand-text-muted">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="font-semibold text-brand-green transition-colors hover:text-brand-green/80"
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
