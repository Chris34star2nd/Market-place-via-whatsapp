import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, BarChart3, CreditCard,
  Plus, Pencil, Trash2, Eye, EyeOff, X, AlertCircle, TrendingUp,
  MessageCircle, DollarSign, PackageCheck, Clock, Check, XCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Listing, Order, Category } from '@/types';
import { formatPrice, formatDate, timeAgo, formatNumber } from '@/lib/utils';
import { VerificationBadge } from '@/components/VerificationBadge';
import { TIER_CONFIG, SITE_CONFIG } from '@/config';

type Tab = 'overview' | 'listings' | 'orders' | 'subscription';

export function SellerDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sellerInfo, setSellerInfo] = useState<{ business_name: string; verification_tier: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [listingForm, setListingForm] = useState({
    title: '',
    description: '',
    price: '',
    type: 'product',
    condition: 'new',
    location: 'Nairobi CBD',
    category_id: '',
    images: [''] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!profile?.seller_id) {
      setLoading(false);
      return;
    }

    const [listingsRes, ordersRes, catsRes, sellerRes] = await Promise.all([
      supabase.from('listings').select('*, category:categories(*)').eq('seller_id', profile.seller_id).order('created_at', { ascending: false }),
      supabase.from('orders').select('*, listing:listings(*)').eq('seller_id', profile.seller_id).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('sellers').select('business_name, verification_tier').eq('id', profile.seller_id).maybeSingle(),
    ]);

    setListings(listingsRes.data || []);
    setOrders(ordersRes.data || []);
    setCategories(catsRes.data || []);
    setSellerInfo(sellerRes.data);
    setLoading(false);
  }, [profile?.seller_id]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
        return;
      }
      fetchData();
    }
  }, [authLoading, user, navigate, fetchData]);

  const activeListings = listings.filter((l) => l.status === 'active');
  const totalViews = listings.reduce((sum, l) => sum + (l.views_count || 0), 0);
  const totalWhatsAppClicks = listings.reduce((sum, l) => sum + (l.whatsapp_clicks || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending');

  const tierConfig = sellerInfo ? TIER_CONFIG[sellerInfo.verification_tier as keyof typeof TIER_CONFIG] : TIER_CONFIG.unverified;

  const handleSaveListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.seller_id) return;
    setSubmitting(true);
    setFormError(null);

    const images = listingForm.images.filter((url) => url.trim() !== '');
    if (images.length === 0) {
      setFormError('At least one image URL is required.');
      setSubmitting(false);
      return;
    }
    if (images.length > 6) {
      setFormError('Maximum 6 images per listing.');
      setSubmitting(false);
      return;
    }

    const slug = listingForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);

    const data: Record<string, unknown> = {
      seller_id: profile.seller_id,
      title: listingForm.title,
      slug,
      description: listingForm.description,
      price: parseFloat(listingForm.price) || 0,
      type: listingForm.type,
      condition: listingForm.condition,
      location: listingForm.location,
      city: 'Nairobi',
      category_id: listingForm.category_id || null,
      images: JSON.stringify(images),
      status: 'active',
    };

    if (editingListing) {
      const { error } = await supabase.from('listings').update(data).eq('id', editingListing.id);
      if (error) setFormError(error.message);
    } else {
      const count = activeListings.length;
      if (count >= tierConfig.maxProducts) {
        setFormError(`You've reached the maximum of ${tierConfig.maxProducts} listings for the ${tierConfig.label} tier. Upgrade to list more.`);
        setSubmitting(false);
        return;
      }
      const { error } = await supabase.from('listings').insert(data);
      if (error) setFormError(error.message);
    }

    setSubmitting(false);
    if (!formError) {
      setShowAddForm(false);
      setEditingListing(null);
      fetchData();
      setListingForm({
        title: '', description: '', price: '', type: 'product', condition: 'new',
        location: 'Nairobi CBD', category_id: '', images: [''],
      });
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    await supabase.from('listings').delete().eq('id', id);
    fetchData();
  };

  const handleToggleListingStatus = async (listing: Listing) => {
    const newStatus = listing.status === 'active' ? 'paused' : 'active';
    await supabase.from('listings').update({ status: newStatus }).eq('id', listing.id);
    fetchData();
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    fetchData();
  };

  const openEditForm = (listing: Listing) => {
    setEditingListing(listing);
    setListingForm({
      title: listing.title,
      description: listing.description || '',
      price: String(listing.price),
      type: listing.type,
      condition: listing.condition,
      location: listing.location,
      category_id: listing.category_id || '',
      images: listing.images?.length ? listing.images : [''],
    });
    setShowAddForm(true);
  };

  if (authLoading || loading) {
    return (
      <div className="container-app py-6">
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!profile?.is_seller) {
    return (
      <div className="container-app py-16 text-center">
        <AlertCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <h1 className="text-xl font-bold">No seller account found</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">You need a seller account to access the dashboard.</p>
        <Link to="/sell" className="btn-primary mt-4">Become a Seller</Link>
      </div>
    );
  }

  return (
    <div className="container-app py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Seller Dashboard</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">{sellerInfo?.business_name}</span>
            {sellerInfo && <VerificationBadge tier={sellerInfo.verification_tier as 'unverified' | 'verified' | 'silver' | 'gold'} />}
          </div>
        </div>
        <button
          onClick={() => { setEditingListing(null); setShowAddForm(true); setListingForm({ title: '', description: '', price: '', type: 'product', condition: 'new', location: 'Nairobi CBD', category_id: '', images: [''] }); }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Listing
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <Package className="w-5 h-5 text-primary-600" />
            <span className="text-2xl font-bold">{activeListings.length}</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Active Listings ({tierConfig.maxProducts === Infinity ? 'unlimited' : `max ${tierConfig.maxProducts}`})</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <Eye className="w-5 h-5 text-primary-600" />
            <span className="text-2xl font-bold">{formatNumber(totalViews)}</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Total Views</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <MessageCircle className="w-5 h-5 text-primary-600" />
            <span className="text-2xl font-bold">{totalWhatsAppClicks}</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">WhatsApp Clicks</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <ShoppingBag className="w-5 h-5 text-primary-600" />
            <span className="text-2xl font-bold">{pendingOrders.length}</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Pending Orders</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview', icon: LayoutDashboard },
          { key: 'listings', label: 'Listings', icon: Package },
          { key: 'orders', label: 'Orders', icon: ShoppingBag },
          { key: 'subscription', label: 'Subscription', icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as Tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Recent Activity</h2>
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{order.listing?.title}</p>
                  <p className="text-xs text-neutral-500">{order.buyer_name} · {timeAgo(order.created_at)}</p>
                </div>
                <span className={`badge ${order.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'}`}>
                  {order.status}
                </span>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-6">No orders yet</p>
            )}
          </div>
        </div>
      )}

      {/* Listings Tab */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          {listings.length === 0 ? (
            <div className="card p-12 text-center">
              <Package className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">No listings yet. Click "Add Listing" to create your first one.</p>
            </div>
          ) : (
            listings.map((listing) => (
              <div key={listing.id} className="card p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                  {listing.images?.[0] && <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{listing.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                    <span>{formatPrice(listing.price)}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{listing.views_count}</span>
                    <span className={`badge ${
                      listing.status === 'active' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' :
                      listing.status === 'sold' ? 'bg-neutral-100 text-neutral-500' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>{listing.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleToggleListingStatus(listing)} className="btn-ghost p-2" title={listing.status === 'active' ? 'Pause' : 'Activate'}>
                    {listing.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEditForm(listing)} className="btn-ghost p-2" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteListing(listing.id)} className="btn-ghost p-2 text-error-600" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="card p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">No orders yet</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="card p-4">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{order.listing?.title}</p>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-neutral-600 dark:text-neutral-400">
                      <span><strong>Buyer:</strong> {order.buyer_name}</span>
                      <span><strong>Phone:</strong> {order.buyer_phone}</span>
                      <span><strong>Qty:</strong> {order.quantity}</span>
                      <span><strong>Type:</strong> {order.order_type}</span>
                      {order.delivery_notes && <span className="col-span-2"><strong>Notes:</strong> {order.delivery_notes}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`badge ${
                      order.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      order.status === 'completed' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' :
                      'bg-neutral-100 text-neutral-500'
                    }`}>{order.status}</span>
                    <span className="text-xs text-neutral-400">{timeAgo(order.created_at)}</span>
                    {order.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')} className="btn-ghost p-1.5 text-primary-600" title="Confirm">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')} className="btn-ghost p-1.5 text-error-600" title="Cancel">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Current Plan</h2>
              {sellerInfo && <VerificationBadge tier={sellerInfo.verification_tier as 'unverified' | 'verified' | 'silver' | 'gold'} size="md" />}
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              You are on the <strong>{tierConfig.label}</strong> plan. This allows up to {tierConfig.maxProducts === Infinity ? 'unlimited' : tierConfig.maxProducts} product listings.
            </p>
            {sellerInfo?.verification_tier === 'unverified' && (
              <div className="mt-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
                <p className="text-sm text-primary-700 dark:text-primary-400 font-medium">Upgrade to get verified and sell more!</p>
                <p className="text-xs text-primary-600 dark:text-primary-500 mt-1">Plans start at KSh 350/month.</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['verified', 'silver', 'gold'] as const).map((tier) => {
              const config = TIER_CONFIG[tier];
              const isCurrent = sellerInfo?.verification_tier === tier;
              return (
                <div key={tier} className={`card p-6 ${tier === 'gold' ? 'ring-2 ring-amber-300 dark:ring-amber-700' : ''}`}>
                  <VerificationBadge tier={tier} size="md" />
                  <p className="text-2xl font-bold mt-3">{SITE_CONFIG.currency} {config.monthlyPrice.toLocaleString()}<span className="text-sm font-normal text-neutral-500">/mo</span></p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">Up to {config.maxProducts === Infinity ? 'unlimited' : config.maxProducts} products</p>
                  <button
                    disabled={isCurrent}
                    className={`btn-primary w-full mt-4 ${isCurrent ? 'opacity-50 cursor-default' : ''}`}
                  >
                    {isCurrent ? 'Current Plan' : `Upgrade to ${config.label}`}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-center text-neutral-400">
            Payments are processed securely via Paystack. Subscription upgrade requires API keys to be configured.
          </p>
        </div>
      )}

      {/* Add/Edit Listing Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowAddForm(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editingListing ? 'Edit Listing' : 'Add New Listing'}</h2>
              <button onClick={() => setShowAddForm(false)} className="btn-ghost p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-3 mb-4 text-sm text-error-700 dark:text-error-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveListing} className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <input required type="text" value={listingForm.title} onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })} className="input" placeholder="Product name" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={listingForm.description} onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })} className="input min-h-[80px]" placeholder="Describe your product..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Price (KSh) *</label>
                  <input required type="number" min={0} value={listingForm.price} onChange={(e) => setListingForm({ ...listingForm, price: e.target.value })} className="input" placeholder="0" />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select value={listingForm.type} onChange={(e) => setListingForm({ ...listingForm, type: e.target.value })} className="input">
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Condition</label>
                  <select value={listingForm.condition} onChange={(e) => setListingForm({ ...listingForm, condition: e.target.value })} className="input">
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="refurbished">Refurbished</option>
                  </select>
                </div>
                <div>
                  <label className="label">Location</label>
                  <input type="text" value={listingForm.location} onChange={(e) => setListingForm({ ...listingForm, location: e.target.value })} className="input" />
                </div>
              </div>
              <div>
                <label className="label">Category</label>
                <select value={listingForm.category_id} onChange={(e) => setListingForm({ ...listingForm, category_id: e.target.value })} className="input">
                  <option value="">Select category</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Image URLs (max 6)</label>
                <p className="text-xs text-neutral-400 mb-2">Paste direct image URLs. In production, images upload to Cloudinary.</p>
                {listingForm.images.map((url, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        const images = [...listingForm.images];
                        images[i] = e.target.value;
                        setListingForm({ ...listingForm, images });
                      }}
                      className="input"
                      placeholder="https://..."
                    />
                    {listingForm.images.length > 1 && (
                      <button type="button" onClick={() => setListingForm({ ...listingForm, images: listingForm.images.filter((_, idx) => idx !== i) })} className="btn-ghost p-2">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {listingForm.images.length < 6 && (
                  <button type="button" onClick={() => setListingForm({ ...listingForm, images: [...listingForm.images, ''] })} className="btn-outline text-sm">
                    <Plus className="w-4 h-4" />
                    Add Image
                  </button>
                )}
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Saving...' : editingListing ? 'Update Listing' : 'Create Listing'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
