import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, Users, Package, Flag, DollarSign, BarChart3, ScrollText,
  AlertCircle, TrendingUp, Eye, Trash2, Ban, Check, Crown,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Seller, Listing, Report, Payment, AuditLog } from '@/types';
import { formatPrice, formatDateTime, formatNumber, timeAgo } from '@/lib/utils';
import { VerificationBadge } from '@/components/VerificationBadge';

type AdminTab = 'overview' | 'sellers' | 'listings' | 'reports' | 'payments' | 'audit';

export function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [sellersRes, listingsRes, reportsRes, paymentsRes, auditRes] = await Promise.all([
      supabase.from('sellers').select('*').order('created_at', { ascending: false }),
      supabase.from('listings').select('*, seller:sellers(*)').order('created_at', { ascending: false }).limit(50),
      supabase.from('reports').select('*, listing:listings(*)').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    setSellers(sellersRes.data || []);
    setListings(listingsRes.data || []);
    setReports(reportsRes.data || []);
    setPayments(paymentsRes.data || []);
    setAuditLogs(auditRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
        return;
      }
      if (!profile?.is_admin) {
        navigate('/');
        return;
      }
      fetchData();
    }
  }, [authLoading, user, profile, navigate, fetchData]);

  const logAction = async (action: string, targetType: string, targetId: string) => {
    if (!user) return;
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action,
      target_type: targetType,
      target_id: targetId,
    });
  };

  const handleBanSeller = async (seller: Seller) => {
    await supabase.from('sellers').update({ is_banned: !seller.is_banned }).eq('id', seller.id);
    await logAction(seller.is_banned ? 'unban_seller' : 'ban_seller', 'seller', seller.id);
    fetchData();
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    await supabase.from('listings').delete().eq('id', id);
    await logAction('delete_listing', 'listing', id);
    fetchData();
  };

  const handleResolveReport = async (id: string, status: string) => {
    await supabase.from('reports').update({ status }).eq('id', id);
    await logAction(`resolve_report_${status}`, 'report', id);
    fetchData();
  };

  const handleUpdateTier = async (seller: Seller, tier: string) => {
    await supabase.from('sellers').update({ verification_tier: tier }).eq('id', seller.id);
    await logAction(`change_tier_${tier}`, 'seller', seller.id);
    fetchData();
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

  if (!profile?.is_admin) {
    return (
      <div className="container-app py-16 text-center">
        <Shield className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">You need admin privileges to access this page.</p>
      </div>
    );
  }

  const totalRevenue = payments.filter((p) => p.status === 'success').reduce((sum, p) => sum + p.amount, 0);
  const pendingReports = reports.filter((r) => r.status === 'pending');

  return (
    <div className="container-app py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Super Admin · {user?.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <Users className="w-5 h-5 text-primary-600" />
            <span className="text-2xl font-bold">{sellers.length}</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Total Sellers</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <Package className="w-5 h-5 text-primary-600" />
            <span className="text-2xl font-bold">{formatNumber(listings.length)}</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Total Listings</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <DollarSign className="w-5 h-5 text-primary-600" />
            <span className="text-2xl font-bold">{formatPrice(totalRevenue)}</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Total Revenue</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <Flag className="w-5 h-5 text-primary-600" />
            <span className="text-2xl font-bold">{pendingReports.length}</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Pending Reports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'sellers', label: 'Sellers', icon: Users },
          { key: 'listings', label: 'Listings', icon: Package },
          { key: 'reports', label: 'Reports', icon: Flag },
          { key: 'payments', label: 'Payments', icon: DollarSign },
          { key: 'audit', label: 'Audit Log', icon: ScrollText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.key === 'reports' && pendingReports.length > 0 && (
                <span className="badge bg-error-500 text-white">{pendingReports.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Revenue by Tier</h2>
            <div className="space-y-3">
              {(['gold', 'silver', 'verified'] as const).map((tier) => {
                const tierSellers = sellers.filter((s) => s.verification_tier === tier);
                const tierRevenue = payments
                  .filter((p) => p.status === 'success' && tierSellers.some((s) => s.id === p.seller_id))
                  .reduce((sum, p) => sum + p.amount, 0);
                const maxRevenue = totalRevenue || 1;
                return (
                  <div key={tier}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <VerificationBadge tier={tier} />
                        <span className="text-neutral-500">{tierSellers.length} sellers</span>
                      </div>
                      <span className="font-semibold">{formatPrice(tierRevenue)}</span>
                    </div>
                    <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          tier === 'gold' ? 'bg-amber-500' : tier === 'silver' ? 'bg-slate-400' : 'bg-blue-500'
                        }`}
                        style={{ width: `${(tierRevenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold mb-4">Recent Sellers</h2>
            {sellers.slice(0, 5).map((seller) => (
              <div key={seller.id} className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <Link to={`/seller/${seller.slug}`} className="text-sm font-medium hover:text-primary-600 truncate">
                    {seller.business_name}
                  </Link>
                  <VerificationBadge tier={seller.verification_tier} />
                </div>
                <span className="text-xs text-neutral-400">{timeAgo(seller.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sellers */}
      {activeTab === 'sellers' && (
        <div className="space-y-3">
          {sellers.map((seller) => (
            <div key={seller.id} className="card p-4 flex items-center gap-4 flex-wrap">
              <Link to={`/seller/${seller.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden flex-shrink-0">
                  {seller.logo_url ? <img src={seller.logo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-neutral-400">{seller.business_name[0]}</div>}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{seller.business_name}</p>
                  <p className="text-xs text-neutral-500">{seller.location} · {timeAgo(seller.joined_date)}</p>
                </div>
              </Link>
              <VerificationBadge tier={seller.verification_tier} />
              {seller.is_banned && <span className="badge bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400">Banned</span>}
              <select
                value={seller.verification_tier}
                onChange={(e) => handleUpdateTier(seller, e.target.value)}
                className="input text-sm w-auto"
              >
                <option value="unverified">Unverified</option>
                <option value="verified">Verified</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
              </select>
              <button onClick={() => handleBanSeller(seller)} className={`btn-ghost p-2 ${seller.is_banned ? 'text-primary-600' : 'text-error-600'}`} title={seller.is_banned ? 'Unban' : 'Ban'}>
                {seller.is_banned ? <Check className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Listings */}
      {activeTab === 'listings' && (
        <div className="space-y-3">
          {listings.map((listing) => (
            <div key={listing.id} className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                {listing.images?.[0] && <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />}
              </div>
              <Link to={`/listing/${listing.slug}`} className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{listing.title}</p>
                <p className="text-xs text-neutral-500">{formatPrice(listing.price)} · {listing.seller?.business_name}</p>
              </Link>
              <span className={`badge ${
                listing.status === 'active' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' :
                'bg-neutral-100 text-neutral-500'
              }`}>{listing.status}</span>
              <button onClick={() => handleDeleteListing(listing.id)} className="btn-ghost p-2 text-error-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="card p-12 text-center">
              <Flag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">No reports</p>
            </div>
          ) : reports.map((report) => (
            <div key={report.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{report.reason}</p>
                  {report.details && <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{report.details}</p>}
                  {report.listing && (
                    <Link to={`/listing/${report.listing.slug}`} className="text-xs text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block">
                      View reported listing: {report.listing.title}
                    </Link>
                  )}
                  <p className="text-xs text-neutral-400 mt-2">{timeAgo(report.created_at)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`badge ${
                    report.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  }`}>{report.status}</span>
                  {report.status === 'pending' && (
                    <div className="flex gap-1">
                      <button onClick={() => handleResolveReport(report.id, 'resolved')} className="btn-ghost p-1.5 text-primary-600" title="Resolve">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleResolveReport(report.id, 'dismissed')} className="btn-ghost p-1.5" title="Dismiss">
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payments */}
      {activeTab === 'payments' && (
        <div className="space-y-3">
          {payments.length === 0 ? (
            <div className="card p-12 text-center">
              <DollarSign className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">No payments recorded yet</p>
              <p className="text-xs text-neutral-400 mt-1">Payments will appear here once Paystack is configured.</p>
            </div>
          ) : payments.map((payment) => (
            <div key={payment.id} className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{formatPrice(payment.amount)}</p>
                <p className="text-xs text-neutral-500">{payment.paystack_reference || 'No ref'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400">{formatDateTime(payment.created_at)}</span>
                <span className={`badge ${
                  payment.status === 'success' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' :
                  payment.status === 'failed' ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>{payment.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Log */}
      {activeTab === 'audit' && (
        <div className="space-y-2">
          {auditLogs.length === 0 ? (
            <div className="card p-12 text-center">
              <ScrollText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">No audit logs yet</p>
            </div>
          ) : auditLogs.map((log) => (
            <div key={log.id} className="card p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                  <ScrollText className="w-4 h-4 text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">{log.action}</p>
                  <p className="text-xs text-neutral-500">{log.actor_email || 'System'}</p>
                </div>
              </div>
              <span className="text-xs text-neutral-400">{formatDateTime(log.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
