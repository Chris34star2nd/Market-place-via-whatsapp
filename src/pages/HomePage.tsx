import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Smartphone, Shirt, Sofa, Car, ShoppingCart, Home, Laptop,
  Wrench, Heart, Briefcase, TrendingUp, ArrowRight, Shield, Package
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Listing, Category } from '@/types';
import { ListingCard } from '@/components/ListingCard';
import { ListingCardSkeleton } from '@/components/Skeleton';

const ICON_MAP: Record<string, typeof Smartphone> = {
  Smartphone, Shirt, Sofa, Car, ShoppingCart, Home, Laptop, Wrench, Heart, Briefcase,
};

export function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'product' | 'service'>('all');

  const fetchListings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select(`
        *,
        seller:sellers(*),
        category:categories(*)
      `)
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(24);

    if (activeTab !== 'all') {
      query = query.eq('type', activeTab);
    }

    const { data } = await query;
    setListings(data || []);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setCategories(data || []));
  }, []);

  const featuredListings = listings.filter((l) => l.is_featured).slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="container-app py-12 sm:py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Buy and sell across Kenya
            </h1>
            <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
              Find products and services from verified businesses. Order via WhatsApp or on-platform — no account needed.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/search" className="btn-primary btn-lg">
                <Package className="w-5 h-5" />
                Browse Marketplace
              </Link>
              <Link to="/sell" className="btn-outline btn-lg">
                <TrendingUp className="w-5 h-5" />
                Start Selling
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-app py-8">
        <h2 className="text-xl font-bold mb-4">Categories</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-3">
          {categories.map((cat) => {
            const Icon = ICON_MAP[cat.icon] || Package;
            return (
              <Link
                key={cat.id}
                to={`/search?category=${cat.slug}`}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
                  <Icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                </div>
                <span className="text-xs text-center text-neutral-700 dark:text-neutral-300">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Listings */}
      {featuredListings.length > 0 && (
        <section className="container-app py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              Featured Listings
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)
            ) : (
              featuredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            )}
          </div>
        </section>
      )}

      {/* Tabs + Latest Listings */}
      <section className="container-app py-8 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Latest Listings</h2>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: 'All' },
            { key: 'product', label: 'Products' },
            { key: 'service', label: 'Services' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'all' | 'product' | 'service')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 dark:text-neutral-400">No listings found. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* Trust Banner */}
      <section className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
        <div className="container-app py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Verified Sellers</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Look for verification badges. Verified businesses have been vetted by our team.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">No Account Needed</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Browse and order without signing up. Order via WhatsApp or fill a quick form.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Grow Your Business</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Get verified and reach more buyers across Kenya. Plans from KSh 350/month.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
