import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, SlidersHorizontal, X, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Listing, Category } from '@/types';
import { ListingCard } from '@/components/ListingCard';
import { ListingCardSkeleton } from '@/components/Skeleton';
import { NAIROBI_AREAS } from '@/config';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Viewed' },
];

const PRICE_RANGES = [
  { label: 'Under KSh 1,000', min: 0, max: 1000 },
  { label: 'KSh 1,000 - 10,000', min: 1000, max: 10000 },
  { label: 'KSh 10,000 - 50,000', min: 10000, max: 50000 },
  { label: 'KSh 50,000 - 500,000', min: 50000, max: 500000 },
  { label: 'Over KSh 500,000', min: 500000, max: 99999999 },
];

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 24;

  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const category = searchParams.get('category') || '';
  const location = searchParams.get('location') || '';
  const verifiedOnly = searchParams.get('verified') === 'true';
  const sort = searchParams.get('sort') || 'newest';
  const priceRange = searchParams.get('priceRange') || '';

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories(data || []));
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select(`
        *,
        seller:sellers(*),
        category:categories(*)
      `, { count: 'exact' })
      .eq('status', 'active');

    if (type !== 'all') query = query.eq('type', type);
    if (category) {
      const cat = categories.find((c) => c.slug === category);
      if (cat) query = query.eq('category_id', cat.id);
    }
    if (q) query = query.ilike('title', `%${q}%`);
    if (location) query = query.ilike('location', `%${location}%`);
    if (verifiedOnly) {
      query = query.in('seller.verification_tier', ['verified', 'silver', 'gold']);
    }

    if (priceRange) {
      const range = PRICE_RANGES[parseInt(priceRange)];
      if (range) {
        query = query.gte('price', range.min).lt('price', range.max);
      }
    }

    switch (sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'price_low':
        query = query.order('price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false });
        break;
      case 'popular':
        query = query.order('views_count', { ascending: false });
        break;
      default:
        query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
    }

    query = query.range(page * pageSize, (page + 1) * pageSize - 1);

    const { data, count } = await query;
    setListings(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  }, [q, type, category, location, verifiedOnly, sort, priceRange, page, categories]);

  useEffect(() => {
    setPage(0);
    fetchListings();
  }, [fetchListings]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = !!(q || type !== 'all' || category || location || verifiedOnly || priceRange);

  return (
    <div className="container-app py-6">
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => updateParam('q', e.target.value)}
            placeholder="Search for products and services..."
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-black/50' : 'hidden'} lg:relative lg:block lg:bg-transparent lg:z-0 lg:w-64 flex-shrink-0`}>
          <div className={`${showFilters ? 'fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-neutral-900 overflow-y-auto p-5 lg:static lg:w-full lg:p-0' : ''} lg:block`}>
            {showFilters && (
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <h3 className="font-semibold">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="btn-ghost p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="space-y-5 lg:sticky lg:top-20">
              <div>
                <h3 className="font-semibold text-sm mb-3">Type</h3>
                <div className="space-y-2">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'product', label: 'Products' },
                    { key: 'service', label: 'Services' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => updateParam('type', t.key === 'all' ? '' : t.key)}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        type === t.key || (type === 'all' && t.key === 'all')
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3">Category</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => updateParam('category', cat.slug === category ? '' : cat.slug)}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        category === cat.slug
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3">Price Range</h3>
                <div className="space-y-2">
                  {PRICE_RANGES.map((range, i) => (
                    <button
                      key={i}
                      onClick={() => updateParam('priceRange', priceRange === String(i) ? '' : String(i))}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        priceRange === String(i)
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3">Location</h3>
                <select
                  value={location}
                  onChange={(e) => updateParam('location', e.target.value)}
                  className="input text-sm"
                >
                  <option value="">All locations</option>
                  {NAIROBI_AREAS.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => updateParam('verified', e.target.checked ? 'true' : '')}
                    className="w-4 h-4 rounded accent-primary-600"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Verified sellers only</span>
                </label>
              </div>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn-outline w-full text-sm">
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold">
                {loading ? 'Searching...' : `${totalCount} result${totalCount !== 1 ? 's' : ''}`}
              </h1>
              {q && <p className="text-sm text-neutral-500 dark:text-neutral-400">for "{q}"</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(true)}
                className="btn-outline lg:hidden"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="input text-sm w-auto"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400 text-lg font-medium">No listings found</p>
              <p className="text-sm text-neutral-400 mt-1">Try adjusting your filters or search terms</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn-primary mt-4">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {totalCount > pageSize && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="btn-outline"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Page {page + 1} of {Math.ceil(totalCount / pageSize)}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={(page + 1) * pageSize >= totalCount}
                    className="btn-outline"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
