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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-5xl sm:text-6xl font-bold text-foreground mb-6 leading-tight">
            Turn Your Passion Into Impact
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Subscribe to our golf charity platform, log your scores, and stand a chance to win monthly prizes while supporting causes you care about.
          </p>
          <div className="flex gap-4 justify-center flex-col sm:flex-row mb-12">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="text-3xl font-bold text-primary mb-2">10K+</div>
              <p className="text-muted-foreground">Active Golfers</p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="text-3xl font-bold text-primary mb-2">$500K+</div>
              <p className="text-muted-foreground">Donated to Charities</p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <p className="text-muted-foreground">Partner Charities</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-foreground">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { num: '1', title: 'Subscribe', desc: 'Choose your plan and select a charity' },
              { num: '2', title: 'Log Scores', desc: 'Track your golf scores after each game' },
              { num: '3', title: 'Enter Draw', desc: 'Automatically entered in monthly draws' },
              { num: '4', title: 'Win & Give', desc: 'Win prizes while supporting your cause' }
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4">
                    {step.num}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-center text-muted-foreground text-sm">{step.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-border"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monthly Prize Draws Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-card border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-foreground">Monthly Prize Draws</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { matches: '5 Matches', prize: '40% of Prize Pool', subtitle: 'Jackpot rolls over if unclaimed', color: 'from-yellow-500 to-orange-500' },
              { matches: '4 Matches', prize: '35% of Prize Pool', subtitle: 'Split equally among winners', color: 'from-blue-500 to-blue-700' },
              { matches: '3 Matches', prize: '25% of Prize Pool', subtitle: 'Split equally among winners', color: 'from-cyan-500 to-cyan-700' }
            ].map((draw, i) => (
              <div key={i} className={`p-8 rounded-lg bg-gradient-to-br ${draw.color} text-white text-center`}>
                <Gift className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">{draw.matches}</h3>
                <p className="text-xl font-semibold">{draw.prize}</p>
                <p className="text-sm mt-2 opacity-80">{draw.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Charities Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-foreground">Featured Charities</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Support organizations making real impact
          </p>
          
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading charities...</p>
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featured.map((charity) => (
                <div key={charity._id} className="p-6 rounded-lg border border-border hover:border-primary transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-foreground">{charity.name}</h3>
                    {charity.featured && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                  </div>
                  <p className="text-muted-foreground mb-4">{charity.description}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Heart className="w-4 h-4" />
                    <span className="capitalize">{charity.category}</span>
                  </div>
                  <Link href={charity.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      Learn More <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No featured charities available</p>
            </div>
          )}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 to-primary/5 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            Ready to Make a Difference?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of golfers who are combining their passion for the game with making real impact on causes they care about.
          </p>
          <div className="flex gap-4 justify-center flex-col sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Already a Member?
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 px-4 sm:px-6 lg:px-8 border-t border-border bg-card">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-semibold text-foreground mb-4">About</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About Us</Link></li>
                <li><Link href="#" className="hover:text-foreground">Our Mission</Link></li>
                <li><Link href="#" className="hover:text-foreground">Impact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Help Center</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="#" className="hover:text-foreground">FAQs</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Terms</Link></li>
                <li><Link href="#" className="hover:text-foreground">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Golf for Charity. All rights reserved. | Made with ❤️ for impact</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
