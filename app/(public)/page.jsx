'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Trophy, Users, Heart, Zap, TrendingUp, Star, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch('/api/charities/featured');
        if (res.ok) {
          const data = await res.json();
          setFeatured(data.data?.charities || []);
        }
      } catch (error) {
        console.error('Error fetching charities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Hero Section */}
      <section className="w-full py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-brand-green mb-6 leading-tight">
            Turn Your Passion Into Impact
          </h1>
          <p className="text-xl text-brand-text-muted mb-12 max-w-2xl mx-auto">
            Subscribe to our golf charity platform, log your scores, and stand a chance to win monthly prizes while supporting causes you care about.
          </p>
          <div className="flex gap-4 justify-center flex-col sm:flex-row mb-16">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto gap-2 bg-brand-gold hover:bg-brand-gold/90 text-brand-text">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-brand-green text-brand-green hover:bg-brand-green/10">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="p-8 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className="text-4xl font-bold text-brand-green mb-2">10K+</div>
              <p className="text-brand-text-muted">Active Golfers</p>
            </div>
            <div className="p-8 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className="text-4xl font-bold text-brand-green mb-2">$500K+</div>
              <p className="text-brand-text-muted">Donated to Charities</p>
            </div>
            <div className="p-8 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className="text-4xl font-bold text-brand-green mb-2">50+</div>
              <p className="text-brand-text-muted">Partner Charities</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-brand-green">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { num: '1', title: 'Subscribe', desc: 'Choose your plan and select a charity' },
              { num: '2', title: 'Log Scores', desc: 'Track your golf scores after each game' },
              { num: '3', title: 'Enter Draw', desc: 'Automatically entered in monthly draws' },
              { num: '4', title: 'Win & Give', desc: 'Win prizes while supporting your cause' }
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-brand-green text-white flex items-center justify-center text-2xl font-bold mb-4">
                    {step.num}
                  </div>
                  <h3 className="text-xl font-semibold text-brand-green mb-2">{step.title}</h3>
                  <p className="text-center text-brand-text-muted text-sm">{step.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-brand-gold"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monthly Prize Draws Section */}
      <section id="prizes" className="w-full py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-brand-green">Monthly Prize Draws</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { matches: '5 Matches', prize: '40% of Prize Pool', subtitle: 'Jackpot rolls over if unclaimed' },
              { matches: '4 Matches', prize: '35% of Prize Pool', subtitle: 'Split equally among winners' },
              { matches: '3 Matches', prize: '25% of Prize Pool', subtitle: 'Split equally among winners' }
            ].map((draw, i) => (
              <div key={i} className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-brand-green text-white p-6 flex items-center gap-3">
                  <Gift className="w-6 h-6" />
                  <div>
                    <h3 className="text-lg font-semibold">{draw.matches}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-2xl font-bold text-brand-gold mb-2">{draw.prize}</p>
                  <p className="text-sm text-brand-text-muted">{draw.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Charities Section */}
      <section id="charities" className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-brand-green">Featured Charities</h2>
          <p className="text-center text-brand-text-muted mb-12 max-w-2xl mx-auto">
            Support organizations making real impact
          </p>
          
          {loading ? (
            <div className="text-center py-12">
              <p className="text-brand-text-muted">Loading charities...</p>
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featured.map((charity) => (
                <div key={charity._id} className="rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-brand-green">{charity.name}</h3>
                    {charity.featured && <Star className="w-5 h-5 text-brand-gold fill-brand-gold" />}
                  </div>
                  <p className="text-brand-text-muted mb-4">{charity.description}</p>
                  <div className="flex items-center gap-2 text-sm text-brand-text-muted mb-4">
                    <span className="inline-block px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-xs font-semibold capitalize">{charity.category}</span>
                  </div>
                  <Link href={charity.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="w-full gap-2 border-brand-green text-brand-green hover:bg-brand-green/10">
                      Learn More <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-brand-text-muted">No featured charities available</p>
            </div>
          )}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-brand-green">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Ready to Make a Difference?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of golfers who are combining their passion for the game with making real impact on causes they care about.
          </p>
          <div className="flex gap-4 justify-center flex-col sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto gap-2 bg-brand-gold hover:bg-brand-gold/90 text-brand-text">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-white text-white bg-transparent hover:bg-white/10 px-8 py-3 rounded-lg font-semibold">
                Already a Member?
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 px-4 sm:px-6 lg:px-8 bg-brand-green text-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-semibold text-white mb-4">About</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li><Link href="#" className="hover:text-white">About Us</Link></li>
                <li><Link href="#" className="hover:text-white">Our Mission</Link></li>
                <li><Link href="#" className="hover:text-white">Impact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li><Link href="#" className="hover:text-white">Features</Link></li>
                <li><Link href="#" className="hover:text-white">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li><Link href="#" className="hover:text-white">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
                <li><Link href="#" className="hover:text-white">FAQs</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li><Link href="#" className="hover:text-white">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms</Link></li>
                <li><Link href="#" className="hover:text-white">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 text-center text-sm text-white/80">
            <p>&copy; 2024 Golf for Charity. All rights reserved. | Made with care for impact</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
