import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('auth_id', userId)
        .maybeSingle();

      if (error) throw error;

      return data?.role || 'talent';
    } catch (err) {
      console.error('Role fetch error:', err);
      return 'talent';
    }
  };

  useEffect(() => {
    let mounted = true;

    // 🔹 1. INIT 
    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;

        if (!mounted) return;

        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          const userRole = await fetchUserRole(session.user.id);
          if (mounted) setRole(userRole);
        } else {
          setRole(null);
        }

      } catch (err) {
        console.error('initAuth error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // 🔹 2. LISTENER (setLoading(true))
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AUTH_EVENT:', event);

        if (!mounted) return;

        try {
          setSession(session);
          setUser(session?.user || null);

          if (session?.user) {
            const userRole = await fetchUserRole(session.user.id);
            if (mounted) setRole(userRole);
          } else {
            setRole(null);
          }

        } catch (err) {
          console.error('auth change error:', err);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    role,
    loading,
    signOut: () => supabase.auth.signOut()
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};