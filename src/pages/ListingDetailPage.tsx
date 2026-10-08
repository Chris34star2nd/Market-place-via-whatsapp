import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Eye, ChevronLeft, ChevronRight, X, ZoomIn,
  MessageCircle, ShoppingCart, Flag, Shield, Check, AlertCircle, ArrowLeft, Phone, Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Listing, Seller } from '@/types';
import { formatPrice, formatDate, buildWhatsAppLink, timeAgo } from '@/lib/utils';
import { VerificationBadge } from '@/components/VerificationBadge';
import { SITE_CONFIG } from '@/config';

export function ListingDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderForm, setOrderForm] = useState({
    buyer_name: '',
    buyer_phone: '',
    buyer_email: '',
    quantity: 1,
    preferred_date: '',
    delivery_notes: '',
  });
  const [reportForm, setReportForm] = useState({
    reporter_name: '',
    reporter_phone: '',
    reason: '',
    details: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from('listings')
      .select(`
        *,
        seller:sellers(*),
        category:categories(*)
      `)
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setListing(data);
          setSeller(data.seller);
          supabase
            .from('listings')
            .update({ views_count: (data.views_count || 0) + 1 })
            .eq('id', data.id)
            .then();
        }
        setLoading(false);
      });
  }, [slug]);

  const handleWhatsAppOrder = () => {
    if (!listing || !seller) return;
    const message = `Hello ${seller.business_name}! I'm interested in "${listing.title}" priced at ${formatPrice(listing.price)} on ${SITE_CONFIG.name}. Listing: ${window.location.origin}/listing/${listing.slug}`;
    const link = buildWhatsAppLink(seller.whatsapp_number, message);
    if (link !== '#') {
      supabase.from('listings').update({ whatsapp_clicks: (listing.whatsapp_clicks || 0) + 1 }).eq('id', listing.id).then();
    }
    window.open(link, '_blank');
  };

  const handlePlatformOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing || !seller) return;
    setSubmitting(true);
    const { error } = await supabase.from('orders').insert({
      listing_id: listing.id,
      seller_id: seller.id,
      buyer_name: orderForm.buyer_name,
      buyer_phone: orderForm.buyer_phone,
      buyer_email: orderForm.buyer_email || null,
      quantity: orderForm.quantity,
      preferred_date: orderForm.preferred_date || null,
      delivery_notes: orderForm.delivery_notes || null,
      order_type: 'platform',
      status: 'pending',
    });
    setSubmitting(false);
    if (!error) {
      setOrderSubmitted(true);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    setSubmitting(true);
    const { error } = await supabase.from('reports').insert({
      listing_id: listing.id,
      reporter_name: reportForm.reporter_name || null,
      reporter_phone: reportForm.reporter_phone || null,
      reason: reportForm.reason,
      details: reportForm.details || null,
      status: 'pending',
    });
    setSubmitting(false);
    if (!error) {
      setShowReportForm(false);
      alert('Report submitted. Our team will review it.');
    }
  };

  if (loading) {
    return (
      <div className="container-app py-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="skeleton aspect-[4/3] rounded-xl" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-6 w-1/3" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container-app py-16 text-center">
        <AlertCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <h1 className="text-xl font-bold">Listing not found</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">This listing may have been removed.</p>
        <Link to="/search" className="btn-primary mt-4">Browse Marketplace</Link>
      </div>
    );
  }

  const images = listing.images || [];
  const isUnverified = seller?.verification_tier === 'unverified';

  return (
    <div className="container-app py-6">
      <button onClick={() => navigate(-1)} className="btn-ghost mb-4 -ml-3">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div>
          <div
            className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 cursor-pointer group"
            onClick={() => images.length > 0 && setLightboxOpen(true)}
          >
            {images[activeImage] ? (
              <img
                src={images[activeImage]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-neutral-300" />
              </div>
            )}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="badge bg-black/60 text-white">
                <ZoomIn className="w-3 h-3" />
                Zoom
              </span>
            </div>
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((p) => (p === 0 ? images.length - 1 : p - 1));
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((p) => (p === images.length - 1 ? 0 : p + 1));
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    i === activeImage
                      ? 'border-primary-600'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            {listing.category && (
              <Link
                to={`/search?category=${listing.category.slug}`}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                {listing.category.name}
              </Link>
            )}
            <h1 className="text-2xl font-bold mt-1">{listing.title}</h1>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">
              {formatPrice(listing.price)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {listing.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Posted {timeAgo(listing.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {listing.views_count} views
            </span>
            {listing.type === 'product' && (
              <span className="badge bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 capitalize">
                {listing.condition}
              </span>
            )}
          </div>

          {/* Order buttons */}
          {listing.status !== 'sold' ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleWhatsAppOrder}
                className="btn btn-lg flex-1 bg-[#25D366] text-white hover:bg-[#1DA851] px-5 py-3"
              >
                <MessageCircle className="w-5 h-5" />
                Order via WhatsApp
              </button>
              <button
                onClick={() => setShowOrderForm(true)}
                className="btn-primary btn-lg flex-1"
              >
                <ShoppingCart className="w-5 h-5" />
                Order on Platform
              </button>
            </div>
          ) : (
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4 text-center">
              <p className="font-semibold text-neutral-600 dark:text-neutral-400">This item has been sold</p>
            </div>
          )}

          {/* Safety warning for unverified sellers */}
          {isUnverified && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Unverified Seller</p>
                <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                  This seller has not been verified by {SITE_CONFIG.name}. Exercise caution — meet in public places, inspect items before paying, and never pay in advance.
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {listing.description && (
            <div>
              <h2 className="font-semibold text-sm mb-2">Description</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>
          )}

          {/* Seller info */}
          {seller && (
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <Link to={`/seller/${seller.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden flex-shrink-0">
                    {seller.logo_url ? (
                      <img src={seller.logo_url} alt={seller.business_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 font-semibold">
                        {seller.business_name[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{seller.business_name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Joined {formatDate(seller.joined_date)}
                    </p>
                  </div>
                </Link>
                <VerificationBadge tier={seller.verification_tier} size="md" />
              </div>
              {seller.description && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-3 line-clamp-2">
                  {seller.description}
                </p>
              )}
              <Link
                to={`/seller/${seller.slug}`}
                className="btn-outline w-full mt-3 text-sm"
              >
                View Seller Profile
              </Link>
            </div>
          )}

          {/* Report button */}
          <button
            onClick={() => setShowReportForm(true)}
            className="text-sm text-neutral-400 hover:text-error-600 flex items-center gap-1"
          >
            <Flag className="w-4 h-4" />
            Report this listing
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button className="absolute top-4 right-4 text-white p-2" onClick={() => setLightboxOpen(false)}>
            <X className="w-6 h-6" />
          </button>
          <img
            src={images[activeImage]}
            alt={listing.title}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImage((p) => (p === 0 ? images.length - 1 : p - 1));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImage((p) => (p === images.length - 1 ? 0 : p + 1));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Order Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowOrderForm(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            {orderSubmitted ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-primary-600" />
                </div>
                <h2 className="text-xl font-bold">Order Sent!</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                  Your order has been sent to {seller?.business_name}. They will contact you soon.
                </p>
                <button onClick={() => setShowOrderForm(false)} className="btn-primary mt-4">Close</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Place Order</h2>
                  <button onClick={() => setShowOrderForm(false)} className="btn-ghost p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                  {listing.title} — {formatPrice(listing.price)}
                </p>
                <form onSubmit={handlePlatformOrder} className="space-y-4">
                  <div>
                    <label className="label">Your Name *</label>
                    <input
                      required
                      type="text"
                      value={orderForm.buyer_name}
                      onChange={(e) => setOrderForm({ ...orderForm, buyer_name: e.target.value })}
                      className="input"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="label">Phone Number *</label>
                    <input
                      required
                      type="tel"
                      value={orderForm.buyer_phone}
                      onChange={(e) => setOrderForm({ ...orderForm, buyer_phone: e.target.value })}
                      className="input"
                      placeholder="0712 345 678"
                    />
                  </div>
                  <div>
                    <label className="label">Email (optional)</label>
                    <input
                      type="email"
                      value={orderForm.buyer_email}
                      onChange={(e) => setOrderForm({ ...orderForm, buyer_email: e.target.value })}
                      className="input"
                      placeholder="you@example.com"
                    />
                  </div>
                  {listing.type === 'product' ? (
                    <div>
                      <label className="label">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        value={orderForm.quantity}
                        onChange={(e) => setOrderForm({ ...orderForm, quantity: parseInt(e.target.value) || 1 })}
                        className="input"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="label">Preferred Date</label>
                      <input
                        type="date"
                        value={orderForm.preferred_date}
                        onChange={(e) => setOrderForm({ ...orderForm, preferred_date: e.target.value })}
                        className="input"
                      />
                    </div>
                  )}
                  <div>
                    <label className="label">Delivery Notes (optional)</label>
                    <textarea
                      value={orderForm.delivery_notes}
                      onChange={(e) => setOrderForm({ ...orderForm, delivery_notes: e.target.value })}
                      className="input min-h-[80px]"
                      placeholder="Any special instructions..."
                    />
                  </div>
                  <button type="submit" disabled={submitting} className="btn-primary w-full">
                    {submitting ? 'Sending...' : 'Send Order'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowReportForm(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-md w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Report Listing</h2>
              <button onClick={() => setShowReportForm(false)} className="btn-ghost p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleReport} className="space-y-4">
              <div>
                <label className="label">Reason *</label>
                <select
                  required
                  value={reportForm.reason}
                  onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
                  className="input"
                >
                  <option value="">Select a reason</option>
                  <option value="Scam or fraud">Scam or fraud</option>
                  <option value="Prohibited item">Prohibited item</option>
                  <option value="Misleading information">Misleading information</option>
                  <option value="Duplicate listing">Duplicate listing</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Your Name (optional)</label>
                <input
                  type="text"
                  value={reportForm.reporter_name}
                  onChange={(e) => setReportForm({ ...reportForm, reporter_name: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Your Phone (optional)</label>
                <input
                  type="tel"
                  value={reportForm.reporter_phone}
                  onChange={(e) => setReportForm({ ...reportForm, reporter_phone: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Additional Details (optional)</label>
                <textarea
                  value={reportForm.details}
                  onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })}
                  className="input min-h-[80px]"
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
