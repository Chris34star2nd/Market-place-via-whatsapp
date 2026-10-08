import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Users, Package, Flag, DollarSign, BarChart3, ScrollText,
  AlertCircle, Trash2, Ban, Check, Crown, Lock,
  Headphones, Ticket, Tag, Mail, Send, X, Plus, UserCog, UserPlus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Seller, Listing, Report, Payment, AuditLog, SupportTicket, DiscountCode, Role, Permission, UserRole } from '@/types';
import { formatPrice, formatDateTime, formatNumber, timeAgo, formatDate } from '@/lib/utils';
import { VerificationBadge } from '@/components/VerificationBadge';

type AdminTab = 'overview' | 'sellers' | 'listings' | 'reports' | 'payments' | 'tickets' | 'discounts' | 'roles' | 'audit' | 'email';

interface AdminRoleAssignment {
  id: string;
  email: string;
  role_id: string;
  role: Role;
  created_at: string;
}

export function AdminPage() {
  const { adminSession, adminSignIn, adminSignOut, sessionReady, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [adminLoginForm, setAdminLoginForm] = useState({ email: '', password: '' });
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePerms, setRolePerms] = useState<Record<string, string[]>>({});
  const [roleAssignments, setRoleAssignments] = useState<AdminRoleAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '' });
  const [emailSent, setEmailSent] = useState(false);
  const [showAddDiscount, setShowAddDiscount] = useState(false);
  const [discountForm, setDiscountForm] = useState({ code: '', description: '', discount_type: 'percentage', discount_value: '', valid_until: '' });
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', display_name: '', description: '' });
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [showAssignRole, setShowAssignRole] = useState(false);
  const [assignForm, setAssignForm] = useState({ email: '', role_id: '' });

  const isSuperAdmin = profile?.is_super_admin ?? false;
  const adminPermissions: string[] = profile?.admin_permissions ?? [];

  const hasPermission = (perm: string) => isSuperAdmin || adminPermissions.includes(perm);

  const fetchData = useCallback(async () => {
    const [sellersRes, listingsRes, reportsRes, paymentsRes, auditRes, ticketsRes, discountsRes, rolesRes, permsRes] = await Promise.all([
      supabase.from('sellers').select('*').order('created_at', { ascending: false }),
      supabase.from('listings').select('*, seller:sellers(*)').order('created_at', { ascending: false }).limit(50),
      supabase.from('reports').select('*, listing:listings(*)').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('support_tickets').select('*').order('created_at', { ascending: false }),
      supabase.from('discount_codes').select('*').order('created_at', { ascending: false }),
      supabase.from('roles').select('*').order('created_at', { ascending: true }),
      supabase.from('permissions').select('*').order('category', { ascending: true }),
    ]);

    setSellers(sellersRes.data || []);
    setListings(listingsRes.data || []);
    setReports(reportsRes.data || []);
    setPayments(paymentsRes.data || []);
    setAuditLogs(auditRes.data || []);
    setTickets(ticketsRes.data || []);
    setDiscounts(discountsRes.data || []);
    setRoles(rolesRes.data || []);
    setAllPermissions(permsRes.data || []);

    const { data: rpData } = await supabase.from('role_permissions').select('role_id, permission_id');
    const rpMap: Record<string, string[]> = {};
    (rpData || []).forEach((rp) => {
      if (!rpMap[rp.role_id]) rpMap[rp.role_id] = [];
      rpMap[rp.role_id].push(rp.permission_id);
    });
    setRolePerms(rpMap);

    const { data: urData } = await supabase
      .from('user_roles')
      .select('email, role_id, created_at, role:roles(*)')
      .not('email', 'is', null);
    const assignments: AdminRoleAssignment[] = (urData || []).map((ur) => {
      const row = ur as Record<string, unknown>;
      return {
        id: `${row.email}_${row.role_id}`,
        email: row.email as string,
        role_id: row.role_id as string,
        role: row.role as Role,
        created_at: row.created_at as string,
      };
    });
    setRoleAssignments(assignments);

    setLoading(false);
  }, []);

  useEffect(() => {
    if (adminSession && sessionReady) {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) {
          adminSignOut();
        } else {
          fetchData();
        }
      });
    }
  }, [adminSession, sessionReady, fetchData, adminSignOut]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setAdminLoggingIn(true);
    const email = adminLoginForm.email.trim().toLowerCase();
    const { error } = await adminSignIn(email, adminLoginForm.password);
    if (error) {
      setAdminLoginError(error);
    } else {
      setAdminLoginForm({ email: '', password: '' });
    }
    setAdminLoggingIn(false);
  };

  const logAction = async (action: string, targetType: string, targetId: string) => {
    await supabase.from('audit_logs').insert({
      actor_email: adminSession?.email || 'admin@sokohub.co.ke',
      action,
      target_type: targetType,
      target_id: targetId,
    });
  };

  const handleBanSeller = async (seller: Seller) => {
    setActionError(null);
    const { error } = await supabase.from('sellers').update({ is_banned: !seller.is_banned }).eq('id', seller.id);
    if (error) { setActionError(error.message); return; }
    await logAction(seller.is_banned ? 'unban_seller' : 'ban_seller', 'seller', seller.id);
    setActionSuccess(seller.is_banned ? 'Seller unbanned' : 'Seller banned');
    fetchData();
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    setActionError(null);
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (error) { setActionError(error.message); return; }
    await logAction('delete_listing', 'listing', id);
    setActionSuccess('Listing deleted');
    fetchData();
  };

  const handleResolveReport = async (id: string, status: string) => {
    setActionError(null);
    const { error } = await supabase.from('reports').update({ status }).eq('id', id);
    if (error) { setActionError(error.message); return; }
    await logAction(`resolve_report_${status}`, 'report', id);
    setActionSuccess(`Report ${status}`);
    fetchData();
  };

  const handleUpdateTier = async (seller: Seller, tier: string) => {
    setActionError(null);
    const { error } = await supabase.from('sellers').update({ verification_tier: tier }).eq('id', seller.id);
    if (error) { setActionError(error.message); return; }
    await logAction(`change_tier_${tier}`, 'seller', seller.id);
    setActionSuccess(`${seller.business_name} moved to ${tier}`);
    fetchData();
  };

  const handleUpdateTicketStatus = async (id: string, status: string) => {
    setActionError(null);
    const { error } = await supabase.from('support_tickets').update({ status }).eq('id', id);
    if (error) { setActionError(error.message); return; }
    await logAction(`ticket_status_${status}`, 'ticket', id);
    setActionSuccess('Ticket updated');
    fetchData();
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    const { error } = await supabase.from('discount_codes').insert({
      code: discountForm.code.toUpperCase(),
      description: discountForm.description,
      discount_type: discountForm.discount_type,
      discount_value: parseFloat(discountForm.discount_value) || 0,
      valid_until: discountForm.valid_until || null,
      is_active: true,
    });
    if (error) { setActionError(error.message); return; }
    await logAction('create_discount', 'discount', discountForm.code);
    setShowAddDiscount(false);
    setDiscountForm({ code: '', description: '', discount_type: 'percentage', discount_value: '', valid_until: '' });
    setActionSuccess('Discount code created');
    fetchData();
  };

  const handleToggleDiscount = async (d: DiscountCode) => {
    setActionError(null);
    const { error } = await supabase.from('discount_codes').update({ is_active: !d.is_active }).eq('id', d.id);
    if (error) { setActionError(error.message); return; }
    fetchData();
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    const { data, error } = await supabase.from('roles').insert({
      name: roleForm.name.toLowerCase().replace(/\s+/g, '_'),
      display_name: roleForm.display_name,
      description: roleForm.description,
      is_system: false,
    }).select().single();
    if (error) { setActionError(error.message); return; }
    if (data) {
      await logAction('create_role', 'role', data.id);
      setShowCreateRole(false);
      setRoleForm({ name: '', display_name: '', description: '' });
      setActionSuccess('Role created');
      fetchData();
    }
  };

  const handleTogglePermission = async (roleId: string, permId: string) => {
    setActionError(null);
    const current = rolePerms[roleId] || [];
    let error;
    if (current.includes(permId)) {
      ({ error } = await supabase.from('role_permissions').delete().eq('role_id', roleId).eq('permission_id', permId));
    } else {
      ({ error } = await supabase.from('role_permissions').insert({ role_id: roleId, permission_id: permId }));
    }
    if (error) { setActionError(error.message); return; }
    fetchData();
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    const email = assignForm.email.trim().toLowerCase();
    const { error } = await supabase.from('user_roles').insert({
      email,
      role_id: assignForm.role_id,
    });
    if (error) {
      if (error.code === '23505') {
        setActionError('This email already has that role assigned.');
      } else {
        setActionError(error.message);
      }
      return;
    }
    await logAction('assign_role', 'user_role', email);
    setShowAssignRole(false);
    setAssignForm({ email: '', role_id: '' });
    setActionSuccess(`Role assigned to ${email}. They will see the admin panel when they sign in.`);
    fetchData();
  };

  const handleRemoveAssignment = async (email: string, roleId: string) => {
    setActionError(null);
    const { error } = await supabase.from('user_roles').delete().eq('email', email).eq('role_id', roleId);
    if (error) { setActionError(error.message); return; }
    await logAction('remove_role', 'user_role', email);
    setActionSuccess('Role removed');
    fetchData();
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSent(true);
    setTimeout(() => {
      setShowEmailComposer(false);
      setEmailSent(false);
      setEmailForm({ to: '', subject: '', body: '' });
    }, 1500);
  };

  const openEmailComposer = (to: string) => {
    setEmailForm({ to, subject: '', body: '' });
    setShowEmailComposer(true);
  };

  // Admin login gate — show email+password form if not logged in or not an admin
  if (sessionReady && (!adminSession || (!profile?.is_admin && !profile?.is_super_admin))) {
    if (adminSession && profile && !profile.is_admin && !profile.is_super_admin) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full">
            <div className="card p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-error-100 dark:bg-error-900/30 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-error-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                Your account does not have admin access. Only invited admins can access this panel.
              </p>
              <button onClick={() => adminSignOut()} className="btn-outline w-full mb-3">Sign Out</button>
              <Link to="/" className="text-sm text-neutral-400 hover:text-primary-600">Back to SokoHub</Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="card p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold">SokoHub Admin</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                Sign in with your admin email and password to access the control panel.
              </p>
            </div>
            {adminLoginError && (
              <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-3 mb-4 text-sm text-error-700 dark:text-error-400">
                {adminLoginError}
              </div>
            )}
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="label">Admin Email</label>
                <input
                  required
                  type="email"
                  value={adminLoginForm.email}
                  onChange={(e) => setAdminLoginForm({ ...adminLoginForm, email: e.target.value })}
                  className="input"
                  placeholder="admin@sokohub.co.ke"
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  required
                  type="password"
                  value={adminLoginForm.password}
                  onChange={(e) => setAdminLoginForm({ ...adminLoginForm, password: e.target.value })}
                  className="input"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </div>
              <button type="submit" disabled={adminLoggingIn} className="btn-primary w-full">
                <Lock className="w-4 h-4" />
                {adminLoggingIn ? 'Signing in...' : 'Sign In to Admin'}
              </button>
            </form>
            <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800 text-center">
              <Link to="/" className="text-sm text-neutral-400 hover:text-primary-600">
                Back to SokoHub
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="container-app py-6">
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const totalRevenue = payments.filter((p) => p.status === 'success').reduce((sum, p) => sum + p.amount, 0);
  const pendingReports = reports.filter((r) => r.status === 'pending');
  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress');
  const payingSellers = sellers.filter((s) => s.verification_tier !== 'unverified');

  const TABS: { key: AdminTab; label: string; icon: typeof Shield; perm?: string; superOnly?: boolean }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'sellers', label: 'Sellers', icon: Users, perm: 'manage_users' },
    { key: 'listings', label: 'Listings', icon: Package, perm: 'manage_listings' },
    { key: 'reports', label: 'Reports', icon: Flag, perm: 'manage_listings' },
    { key: 'tickets', label: 'Support', icon: Headphones, perm: 'respond_tickets' },
    { key: 'payments', label: 'Payments', icon: DollarSign, perm: 'view_revenue' },
    { key: 'discounts', label: 'Discounts', icon: Tag, perm: 'manage_discounts' },
    { key: 'email', label: 'Send Email', icon: Mail, perm: 'send_emails' },
    { key: 'roles', label: 'Roles', icon: UserCog, superOnly: true },
    { key: 'audit', label: 'Audit Log', icon: ScrollText, perm: 'view_audit' },
  ];

  const visibleTabs = TABS.filter(t => {
    if (t.superOnly) return isSuperAdmin;
    if (t.perm) return hasPermission(t.perm);
    return true;
  });

  // If current tab is not visible to this user, reset to overview
  if (!visibleTabs.some(t => t.key === activeTab)) {
    setActiveTab('overview');
  }

  return (
    <div className="container-app py-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {isSuperAdmin ? 'Super Admin' : profile.admin_roles?.map(r => r.role.display_name).join(', ') || 'Admin'} · {adminSession?.email}
          </p>
        </div>
        </div>
        <button
          onClick={() => adminSignOut()}
          className="btn-outline text-sm"
          title="Sign out of admin"
        >
          <Lock className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {actionError && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-3 mb-4 text-sm text-error-700 dark:text-error-400 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-error-400 hover:text-error-600"><X className="w-4 h-4" /></button>
        </div>
      )}
      {actionSuccess && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 mb-4 text-sm text-primary-700 dark:text-primary-400 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-primary-400 hover:text-primary-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <Users className="w-5 h-5 text-primary-600" />
            <span className="text-2xl font-bold">{sellers.length}</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Total Sellers · {payingSellers.length} paying</p>
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
            <Headphones className="w-5 h-5 text-primary-600" />
            <span className="text-2xl font-bold">{openTickets.length}</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Open Tickets · {pendingReports.length} reports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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
              {tab.key === 'tickets' && openTickets.length > 0 && (
                <span className="badge bg-error-500 text-white">{openTickets.length}</span>
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
                const tierRevenue = payments.filter((p) => p.status === 'success' && tierSellers.some((s) => s.id === p.seller_id)).reduce((sum, p) => sum + p.amount, 0);
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
                      <div className={`h-full rounded-full ${tier === 'gold' ? 'bg-amber-500' : tier === 'silver' ? 'bg-slate-400' : 'bg-blue-500'}`} style={{ width: `${(tierRevenue / maxRevenue) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-6">
              <h2 className="font-semibold mb-4">Paying Sellers</h2>
              {payingSellers.map((seller) => (
                <div key={seller.id} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                  <Link to={`/seller/${seller.slug}`} className="text-sm font-medium hover:text-primary-600 truncate">{seller.business_name}</Link>
                  <div className="flex items-center gap-2">
                    <VerificationBadge tier={seller.verification_tier} />
                    {hasPermission('send_emails') && (
                      <button onClick={() => openEmailComposer(seller.email || '')} className="btn-ghost p-1" title="Email">
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {payingSellers.length === 0 && <p className="text-sm text-neutral-400 py-4">No paying sellers</p>}
            </div>
            <div className="card p-6">
              <h2 className="font-semibold mb-4">Recent Sellers</h2>
              {sellers.slice(0, 5).map((seller) => (
                <div key={seller.id} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                  <Link to={`/seller/${seller.slug}`} className="text-sm font-medium hover:text-primary-600 truncate">{seller.business_name}</Link>
                  <span className="text-xs text-neutral-400">{timeAgo(seller.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sellers */}
      {activeTab === 'sellers' && hasPermission('manage_users') && (
        <div className="space-y-3">
          {sellers.map((seller) => (
            <div key={seller.id} className="card p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Link to={`/seller/${seller.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden flex-shrink-0">
                    {seller.logo_url ? <img src={seller.logo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-neutral-400">{seller.business_name[0]}</div>}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{seller.business_name}</p>
                    <p className="text-xs text-neutral-500">{seller.location} · {timeAgo(seller.joined_date)}</p>
                    {seller.email && <p className="text-xs text-neutral-400">{seller.email}</p>}
                  </div>
                </Link>
                <VerificationBadge tier={seller.verification_tier} />
                {seller.is_banned && <span className="badge bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400">Banned</span>}
                {hasPermission('change_tiers') && (
                  <select value={seller.verification_tier} onChange={(e) => handleUpdateTier(seller, e.target.value)} className="input text-sm w-auto">
                    <option value="unverified">Unverified</option>
                    <option value="verified">Verified</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                  </select>
                )}
                {hasPermission('send_emails') && (
                  <button onClick={() => openEmailComposer(seller.email || '')} className="btn-ghost p-2" title="Email seller">
                    <Mail className="w-4 h-4" />
                  </button>
                )}
                {hasPermission('ban_sellers') && (
                  <button onClick={() => handleBanSeller(seller)} className={`btn-ghost p-2 ${seller.is_banned ? 'text-primary-600' : 'text-error-600'}`} title={seller.is_banned ? 'Unban' : 'Ban'}>
                    {seller.is_banned ? <Check className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Listings */}
      {activeTab === 'listings' && hasPermission('manage_listings') && (
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
              <span className={`badge ${listing.status === 'active' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-neutral-100 text-neutral-500'}`}>{listing.status}</span>
              <button onClick={() => handleDeleteListing(listing.id)} className="btn-ghost p-2 text-error-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Reports */}
      {activeTab === 'reports' && hasPermission('manage_listings') && (
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
                  <span className={`badge ${report.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'}`}>{report.status}</span>
                  {report.status === 'pending' && (
                    <div className="flex gap-1">
                      <button onClick={() => handleResolveReport(report.id, 'resolved')} className="btn-ghost p-1.5 text-primary-600" title="Resolve"><Check className="w-4 h-4" /></button>
                      <button onClick={() => handleResolveReport(report.id, 'dismissed')} className="btn-ghost p-1.5" title="Dismiss"><AlertCircle className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Support Tickets */}
      {activeTab === 'tickets' && hasPermission('respond_tickets') && (
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <div className="card p-12 text-center">
              <Headphones className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">No support tickets</p>
            </div>
          ) : tickets.map((ticket) => (
            <div key={ticket.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Ticket className="w-4 h-4 text-primary-600" />
                    <p className="font-medium text-sm">{ticket.subject}</p>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{ticket.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                    <span>From: {ticket.requester_name || ticket.requester_email || 'Anonymous'}</span>
                    <span>{timeAgo(ticket.created_at)}</span>
                    <span className={`badge ${ticket.priority === 'urgent' ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400' : ticket.priority === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-500'}`}>{ticket.priority}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <select value={ticket.status} onChange={(e) => handleUpdateTicketStatus(ticket.id, e.target.value)} className="input text-sm w-auto">
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  {ticket.requester_email && hasPermission('send_emails') && (
                    <button onClick={() => openEmailComposer(ticket.requester_email || '')} className="btn-ghost p-1.5" title="Reply via email">
                      <Mail className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payments */}
      {activeTab === 'payments' && hasPermission('view_revenue') && (
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
                <span className={`badge ${payment.status === 'success' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : payment.status === 'failed' ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>{payment.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Discounts */}
      {activeTab === 'discounts' && hasPermission('manage_discounts') && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddDiscount(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              Create Discount
            </button>
          </div>
          {discounts.length === 0 ? (
            <div className="card p-12 text-center">
              <Tag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">No discount codes yet</p>
            </div>
          ) : discounts.map((d) => (
            <div key={d.id} className="card p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm font-mono">{d.code}</p>
                  <span className={`badge ${d.is_active ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-neutral-100 text-neutral-500'}`}>{d.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {d.discount_type === 'percentage' ? `${d.discount_value}% off` : `${formatPrice(d.discount_value)} off`}
                  {d.description && ` · ${d.description}`}
                  {d.valid_until && ` · Expires ${formatDate(d.valid_until)}`}
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">Used {d.uses_count} times {d.max_uses ? `of ${d.max_uses}` : ''}</p>
              </div>
              <button onClick={() => handleToggleDiscount(d)} className="btn-ghost p-2" title={d.is_active ? 'Deactivate' : 'Activate'}>
                {d.is_active ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Email Composer */}
      {activeTab === 'email' && hasPermission('send_emails') && (
        <div className="max-w-2xl mx-auto">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold">Send Email to Seller</h2>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Compose an email to any seller. This connects to your SMTP server to send messages directly.
            </p>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="label">To</label>
                <input required type="email" value={emailForm.to} onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })} className="input" placeholder="seller@example.com" />
              </div>
              <div>
                <label className="label">Subject</label>
                <input required type="text" value={emailForm.subject} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} className="input" placeholder="Email subject" />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea required value={emailForm.body} onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })} className="input min-h-[200px]" placeholder="Type your message..." />
              </div>
              <button type="submit" disabled={emailSent} className="btn-primary w-full">
                {emailSent ? (
                  <><Check className="w-4 h-4" /> Sent!</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Email</>
                )}
              </button>
            </form>
            <p className="text-xs text-neutral-400 mt-4">
              Quick select: Pick a seller from the Sellers tab and click the email icon to pre-fill the address.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {sellers.filter(s => s.email).slice(0, 8).map(s => (
                <button key={s.id} onClick={() => setEmailForm({ to: s.email || '', subject: '', body: '' })} className="btn-outline text-xs">
                  {s.business_name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Roles & Permissions (Super Admin only) */}
      {activeTab === 'roles' && isSuperAdmin && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAssignRole(true)} className="btn-primary">
              <UserPlus className="w-4 h-4" />
              Assign Role to Email
            </button>
            <button onClick={() => setShowCreateRole(true)} className="btn-outline">
              <Plus className="w-4 h-4" />
              Create Role
            </button>
          </div>

          <div className="card p-4 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-primary-800 dark:text-primary-400">How Role Assignment Works</p>
                <p className="text-xs text-primary-700 dark:text-primary-500 mt-1">
                  Enter an email and assign a role. When that person signs in with Google using the same email, they will see the admin panel with only the tabs their role permits. Businesses without an assigned role will never see the admin panel.
                </p>
              </div>
            </div>
          </div>

          {/* Assigned Admins */}
          {roleAssignments.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-sm mb-3">Assigned Admins</h3>
              <div className="space-y-2">
                {roleAssignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <UserCog className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{a.email}</p>
                        <p className="text-xs text-neutral-500">{a.role.display_name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAssignment(a.email, a.role_id)}
                      className="btn-ghost p-2 text-error-600"
                      title="Remove role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {roles.map((role) => {
            const isExpanded = expandedRole === role.id;
            const perms = rolePerms[role.id] || [];
            const assignedEmails = roleAssignments.filter(a => a.role_id === role.id);
            return (
              <div key={role.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <button onClick={() => setExpandedRole(isExpanded ? null : role.id)} className="flex items-center gap-3 flex-1 text-left">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{role.display_name}</p>
                        {role.is_system && <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">System</span>}
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">{role.description}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{perms.length} permissions · {assignedEmails.length} assigned</p>
                    </div>
                  </button>
                </div>
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
                    <div>
                      <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-3">Permissions</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {allPermissions.map((perm) => {
                          const has = perms.includes(perm.id);
                          const canToggle = role.name !== 'super_admin';
                          return (
                            <button
                              key={perm.id}
                              disabled={!canToggle}
                              onClick={() => handleTogglePermission(role.id, perm.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                                has
                                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                                  : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700'
                              } ${canToggle ? 'hover:opacity-80 cursor-pointer' : 'cursor-default opacity-60'}`}
                            >
                              {has ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {perm.display_name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {assignedEmails.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">Assigned to:</p>
                        <div className="flex flex-wrap gap-2">
                          {assignedEmails.map((a) => (
                            <span key={a.id} className="badge bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs">
                              {a.email}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Audit Log */}
      {activeTab === 'audit' && hasPermission('view_audit') && (
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

      {/* Add Discount Modal */}
      {showAddDiscount && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowAddDiscount(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-md w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create Discount Code</h2>
              <button onClick={() => setShowAddDiscount(false)} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateDiscount} className="space-y-4">
              <div>
                <label className="label">Code *</label>
                <input required type="text" value={discountForm.code} onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value })} className="input font-mono" placeholder="SAVE20" />
              </div>
              <div>
                <label className="label">Description</label>
                <input type="text" value={discountForm.description} onChange={(e) => setDiscountForm({ ...discountForm, description: e.target.value })} className="input" placeholder="20% off for first-time buyers" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select value={discountForm.discount_type} onChange={(e) => setDiscountForm({ ...discountForm, discount_type: e.target.value })} className="input">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="label">Value *</label>
                  <input required type="number" min={0} value={discountForm.discount_value} onChange={(e) => setDiscountForm({ ...discountForm, discount_value: e.target.value })} className="input" placeholder="20" />
                </div>
              </div>
              <div>
                <label className="label">Valid Until (optional)</label>
                <input type="date" value={discountForm.valid_until} onChange={(e) => setDiscountForm({ ...discountForm, valid_until: e.target.value })} className="input" />
              </div>
              <button type="submit" className="btn-primary w-full">Create Discount</button>
            </form>
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateRole && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCreateRole(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-md w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create Custom Role</h2>
              <button onClick={() => setShowCreateRole(false)} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="label">Role Name *</label>
                <input required type="text" value={roleForm.display_name} onChange={(e) => setRoleForm({ ...roleForm, display_name: e.target.value, name: e.target.value })} className="input" placeholder="e.g. Content Reviewer" />
              </div>
              <div>
                <label className="label">Description</label>
                <input type="text" value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} className="input" placeholder="Reviews and approves listings" />
              </div>
              <p className="text-xs text-neutral-400">After creating the role, expand it to toggle permissions on/off.</p>
              <button type="submit" className="btn-primary w-full">Create Role</button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showAssignRole && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowAssignRole(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-md w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Assign Role to Email</h2>
              <button onClick={() => setShowAssignRole(false)} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAssignRole} className="space-y-4">
              <div>
                <label className="label">Email Address *</label>
                <input required type="email" value={assignForm.email} onChange={(e) => setAssignForm({ ...assignForm, email: e.target.value })} className="input" placeholder="person@example.com" />
                <p className="text-xs text-neutral-400 mt-1">When this person signs in with Google using this email, they will see the admin panel.</p>
              </div>
              <div>
                <label className="label">Role *</label>
                <select required value={assignForm.role_id} onChange={(e) => setAssignForm({ ...assignForm, role_id: e.target.value })} className="input">
                  <option value="">Select a role...</option>
                  {roles.filter(r => r.name !== 'super_admin').map(r => (
                    <option key={r.id} value={r.id}>{r.display_name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-primary w-full">Assign Role</button>
            </form>
          </div>
        </div>
      )}

      {/* Email Composer Modal */}
      {showEmailComposer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowEmailComposer(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-lg w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Compose Email</h2>
              <button onClick={() => setShowEmailComposer(false)} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="label">To</label>
                <input required type="email" value={emailForm.to} onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })} className="input" placeholder="recipient@example.com" />
              </div>
              <div>
                <label className="label">Subject</label>
                <input required type="text" value={emailForm.subject} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} className="input" placeholder="Email subject" />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea required value={emailForm.body} onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })} className="input min-h-[160px]" placeholder="Type your message..." />
              </div>
              <button type="submit" disabled={emailSent} className="btn-primary w-full">
                {emailSent ? (
                  <><Check className="w-4 h-4" /> Sent!</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Email</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
