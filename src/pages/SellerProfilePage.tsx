import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Package, AlertCircle, Phone, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Seller, Listing } from '@/types';
import { VerificationBadge } from '@/components/VerificationBadge';
import { ListingCard } from '@/components/ListingCard';
import { ListingCardSkeleton } from '@/components/Skeleton';
import { formatDate, buildWhatsAppLink } from '@/lib/utils';

export function SellerProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from('sellers')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        setSeller(data);
        if (data) {
          supabase
            .from('listings')
            .select('*, category:categories(*))')
            .eq('seller_id', data.id)
            .eq('status', 'active')
            .order('is_featured', { ascending: false })
            .order('created_at', { ascending: false })
            .then(({ data: listingData }) => setListings((listingData || []) as unknown as Listing[]));
        }
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="container-app py-6">
        <div className="skeleton h-32 w-full rounded-xl mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="container-app py-16 text-center">
        <AlertCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <h1 className="text-xl font-bold">Seller not found</h1>
        <Link to="/search" className="btn-primary mt-4">Browse Marketplace</Link>
      </div>
    );
  }

  return (
    <div className="container-app py-6">
      {/* Seller header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden flex-shrink-0">
            {seller.logo_url ? (
              <img src={seller.logo_url} alt={seller.business_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-neutral-400">
                {seller.business_name[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold">{seller.business_name}</h1>
              <VerificationBadge tier={seller.verification_tier} size="md" />
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {seller.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {formatDate(seller.joined_date)}
              </span>
              <span className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                {listings.length} active listing{listings.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          {seller.whatsapp_number && (
            <a
              href={buildWhatsAppLink(seller.whatsapp_number, `Hello ${seller.business_name}!`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-[#25D366] text-white hover:bg-[#1DA851] px-5 py-2.5 text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          )}
        </div>
        {seller.description && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-4 leading-relaxed">
            {seller.description}
          </p>
        )}
      </div>

      {/* Listings */}
      <h2 className="text-lg font-bold mb-4">Listings by {seller.business_name}</h2>
      {listings.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500 dark:text-neutral-400">No active listings yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={{ ...listing, seller }} />
          ))}
        </div>
      )}
    </div>
  );
}
