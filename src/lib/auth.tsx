import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Seller } from '@/types';

interface AuthProfile {
  is_seller: boolean;
  is_admin: boolean;
  seller_id?: string;
  email?: string;
}

interface AuthContextValue {
  user: Session['user'] | null;
  session: Session | null;
  profile: AuthProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

    const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL || '';
    const isAdmin = email === superAdminEmail;

    setProfile({
      is_seller: !!seller,
      is_admin: isAdmin,
      seller_id: seller?.id,
      email,
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
      if (data.session?.user?.email) {
        loadProfile(data.session.user.email).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
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
    <AuthContext.Provider value={{ user: session?.user ?? null, session, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
