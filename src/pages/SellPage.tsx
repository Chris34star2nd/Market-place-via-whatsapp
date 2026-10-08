import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Shield, Check, TrendingUp, Package, Eye, MessageCircle, Crown, Award, BadgeCheck } from 'lucide-react';
import { SITE_CONFIG, TIER_CONFIG } from '@/config';
import { VerificationBadge } from '@/components/VerificationBadge';

const TIER_FEATURES = [
  {
    tier: 'unverified' as const,
    price: 0,
    features: ['List up to 5 products', '6 images per product', 'Basic listing visibility', 'WhatsApp ordering'],
    icon: Shield,
  },
  {
    tier: 'verified' as const,
    price: 350,
    features: ['Blue verified tick', 'Higher search ranking', 'Up to 50 products', 'All free features'],
    icon: BadgeCheck,
  },
  {
    tier: 'silver' as const,
    price: 1000,
    features: ['Silver badge + card highlight', 'Ranked above Verified', 'Up to 200 products', 'All Verified features'],
    icon: Award,
  },
  {
    tier: 'gold' as const,
    price: 2500,
    features: ['Gold badge + premium highlight', 'Top placement in search', 'Featured slot on homepage', 'Unlimited products'],
    icon: Crown,
  },
];

export function SellPage() {
  const navigate = useNavigate();
  const [showPlans, setShowPlans] = useState(false);

  return (
    <div className="container-app py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Start Selling on {SITE_CONFIG.name}</h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mt-3">
            Reach thousands of buyers across Kenya. Get verified and grow your business.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold">Reach More Buyers</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Get your products in front of buyers across Nairobi and beyond.
            </p>
          </div>
          <div className="card p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold">WhatsApp Orders</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Buyers order directly via WhatsApp or fill a quick form on the platform.
            </p>
          </div>
          <div className="card p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold">Get Verified</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Build trust with a verification badge. Plans from KSh 350/month.
            </p>
          </div>
        </div>

        {/* Plans */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-center mb-6">Verification Plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIER_FEATURES.map((plan) => {
              const Icon = plan.icon;
              const isGold = plan.tier === 'gold';
              return (
                <div
                  key={plan.tier}
                  className={`card p-6 relative ${
                    isGold ? 'ring-2 ring-amber-300 dark:ring-amber-700 border-amber-200 dark:border-amber-800' : ''
                  } ${plan.tier === 'silver' ? 'ring-1 ring-slate-300 dark:ring-slate-600' : ''}`}
                >
                  {isGold && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-amber-500 text-white px-3 py-1">
                      Most Popular
                    </span>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`w-6 h-6 ${
                      plan.tier === 'gold' ? 'text-amber-500' :
                      plan.tier === 'silver' ? 'text-slate-400' :
                      plan.tier === 'verified' ? 'text-blue-500' :
                      'text-neutral-400'
                    }`} />
                    <VerificationBadge tier={plan.tier} size="md" />
                  </div>
                  <p className="text-2xl font-bold">
                    {plan.price === 0 ? 'Free' : `${SITE_CONFIG.currency} ${plan.price.toLocaleString()}`}
                    {plan.price > 0 && <span className="text-sm font-normal text-neutral-500">/mo</span>}
                  </p>
                  <ul className="space-y-2 mt-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <Check className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-bold">Ready to start?</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Sign in with Google to create your business profile and start listing products.
          </p>
          <Link to="/login" className="btn-primary btn-lg mt-4">
            <Store className="w-5 h-5" />
            Get Started — Sign in with Google
          </Link>
          <p className="text-xs text-neutral-400 mt-3">
            Browsing and ordering is free — no account needed for buyers.
          </p>
        </div>
      </div>
    </div>
  );
}
