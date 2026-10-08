import { Link } from 'react-router-dom';
import { MapPin, Eye, Tag } from 'lucide-react';
import type { Listing } from '@/types';
import { formatPrice, truncate } from '@/lib/utils';
import { VerificationBadge } from './VerificationBadge';
import { TierCardHighlight } from './TierCardHighlight';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const primaryImage = listing.images?.[0] || '';
  const seller = listing.seller;

  return (
    <Link
      to={`/listing/${listing.slug}`}
      className="group block animate-fade-in"
    >
      <TierCardHighlight tier={seller?.verification_tier || 'unverified'}>
        <div className="relative overflow-hidden rounded-t-xl aspect-[4/3] bg-neutral-100 dark:bg-neutral-800">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={listing.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tag className="w-10 h-10 text-neutral-300" />
            </div>
          )}
          {listing.is_featured && (
            <span className="absolute top-2 left-2 badge bg-amber-500 text-white text-xs">
              Featured
            </span>
          )}
          {listing.status === 'sold' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">SOLD</span>
            </div>
          )}
          {listing.images?.length > 1 && (
            <span className="absolute bottom-2 right-2 badge bg-black/60 text-white text-xs">
              {listing.images.length} photos
            </span>
          )}
        </div>

        <div className="p-3 space-y-2">
          <h3 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {listing.title}
          </h3>

          <p className="text-primary-600 dark:text-primary-400 font-bold text-base">
            {formatPrice(listing.price)}
          </p>

          {listing.condition && listing.type === 'product' && (
            <p className="text-xs text-neutral-500 capitalize">{listing.condition}</p>
          )}

          <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{listing.location}</span>
          </div>

          {seller && (
            <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                {truncate(seller.business_name, 20)}
              </span>
              <VerificationBadge tier={seller.verification_tier} />
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {listing.views_count}
            </span>
          </div>
        </div>
      </TierCardHighlight>
    </Link>
  );
}
