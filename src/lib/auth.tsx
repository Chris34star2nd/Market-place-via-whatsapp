import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Seller, Role, Permission } from '@/types';

interface AdminRole {
  role: Role;
  permissions: Permission[];
}

interface AuthProfile {
  is_seller: boolean;
  is_admin: boolean;
  is_super_admin: boolean;
  seller_id?: string;
  email?: string;
  admin_roles?: AdminRole[];
  admin_permissions?: string[];
}

interface AdminSession {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: Session['user'] | null;
  session: Session | null;
  profile: AuthProfile | null;
  loading: boolean;
  sessionReady: boolean;
  refreshProfile: () => Promise<void>;
  adminPasswordVerified: boolean;
  setAdminPasswordVerified: (v: boolean) => void;
  adminSession: AdminSession | null;
  setAdminSession: (s: AdminSession | null) => void;
  adminSignIn: (email: string, password: string) => Promise<{ error: string | null }>;
  adminSignOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL || '';
const SUPER_ADMIN_PASSWORD = import.meta.env.VITE_SUPER_ADMIN_PASSWORD || '';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [adminPasswordVerified, setAdminPasswordVerified] = useState(false);
  const [adminSession, setAdminSessionState] = useState<AdminSession | null>(() => {
    try {
      const stored = sessionStorage.getItem('admin_session');
      return stored ? JSON.parse(stored) as AdminSession : null;
    } catch {
      return null;
    }
  });

  const setAdminSession = (s: AdminSession | null) => {
    setAdminSessionState(s);
    if (s) {
      sessionStorage.setItem('admin_session', JSON.stringify(s));
    } else {
      sessionStorage.removeItem('admin_session');
    }
  };

  const adminSignIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    setAdminSession({ email, password });
    return { error: null };
  };

  const adminSignOut = async () => {
    await supabase.auth.signOut();
    setAdminSession(null);
  };

  const loadProfile = async (email: string | undefined) => {
    if (!email) {
      setProfile(null);
      return;
    }

    const { data: seller } = await supabase
      .from('sellers')
      .select('id, email, verification_tier, is_banned, is_suspended')
      .eq('email', email)
      .maybeSingle();

    const isSuperAdmin = email === SUPER_ADMIN_EMAIL;

    let adminRoles: AdminRole[] = [];
    let adminPermissions: string[] = [];

    if (isSuperAdmin) {
      const { data: allPerms } = await supabase.from('permissions').select('*');
      const { data: superRole } = await supabase
        .from('roles')
        .select('*')
        .eq('name', 'super_admin')
        .maybeSingle();
      if (superRole && allPerms) {
        adminRoles = [{ role: superRole, permissions: allPerms }];
        adminPermissions = allPerms.map((p) => p.name);
      }
    } else {
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role_id, role:roles(*), role_permissions!inner(permission_id, permission:permissions(*))')
        .eq('user_id', session?.user?.id || '');

      if (userRoles && userRoles.length > 0) {
        for (const ur of userRoles) {
          const role = (ur as Record<string, unknown>).role as Role;
          const perms = ((ur as Record<string, unknown>).role_permissions as Array<{ permission: Permission }>) || [];
          adminRoles.push({ role, permissions: perms.map((p) => p.permission) });
          adminPermissions.push(...perms.map((p) => p.permission.name));
        }
      }
    }

    const isAdmin = isSuperAdmin || adminRoles.length > 0;

    setProfile({
      is_seller: !!seller,
      is_admin: isAdmin,
      is_super_admin: isSuperAdmin,
      seller_id: seller?.id,
      email,
      admin_roles: adminRoles,
      admin_permissions: adminPermissions,
    });
  };

  const refreshProfile = async () => {
    if (session?.user?.email) {
      await loadProfile(session.user.email);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionReady(true);
      if (data.session?.user?.email) {
        loadProfile(data.session.user.email).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setSessionReady(true);
      if (newSession?.user?.email) {
        (async () => {
          await loadProfile(newSession.user.email);
        })();
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      user: session?.user ?? null,
      session,
      profile,
      loading,
      sessionReady,
      refreshProfile,
      adminPasswordVerified,
      setAdminPasswordVerified,
      adminSession,
      setAdminSession,
      adminSignIn,
      adminSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD };
export type { AdminSession };
