import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Profile } from './types';

interface AuthContextValue {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!supabase) {
      setUser(null);
      setProfile(null);
      return;
    }
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) {
      setUser(null);
      setProfile(null);
      return;
    }
    setUser({ id: u.id, email: u.email });
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .eq('id', u.id)
      .single();
    if (data) setProfile(data as Profile);
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session ? { id: data.session.user.id, email: data.session.user.email } : null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? { id: session.user.id, email: session.user.email } : null);
      if (!session) setProfile(null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) refreshProfile();
  }, [user?.id]);

  const isAdmin = !!profile && (profile.role === 'admin' || profile.role === 'moderator');

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
