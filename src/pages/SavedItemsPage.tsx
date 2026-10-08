import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, AlertCircle, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Listing } from '@/types';
import { ListingCard } from '@/components/ListingCard';
import { ListingCardSkeleton } from '@/components/Skeleton';

export function SavedItemsPage() {
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    supabase
      .from('saved_items')
      .select('listing:listings(*, seller:sellers(*), category:categories(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const items = ((data || []) as unknown as { listing: Listing }[]).map((item) => item.listing).filter(Boolean);
        setListings(items);
        setLoading(false);
      });
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="container-app py-6">
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-app py-16 text-center">
        <Bookmark className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <h1 className="text-xl font-bold">Sign in to save items</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">
          You need an account to save listings for later.
        </p>
        <Link to="/login" className="btn-primary mt-4">
          <LogIn className="w-4 h-4" />
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="container-app py-6">
      <h1 className="text-2xl font-bold mb-6">Saved Items</h1>
      {listings.length === 0 ? (
        <div className="text-center py-16">
          <Bookmark className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500 dark:text-neutral-400">No saved items yet</p>
          <Link to="/search" className="btn-primary mt-4">Browse Marketplace</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
