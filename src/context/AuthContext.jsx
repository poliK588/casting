import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    session: null,
    user: null,
    profile: null,
    profileError: false,
    isAuthenticated: false,
    isReady: false,
  });

  useEffect(() => {
    let mounted = true;

    const resolveAuthState = async (session, maxRetries = 2) => {
      if (!session) {
        if (mounted) {
          setAuthState({
            session: null, user: null, profile: null, profileError: false, isAuthenticated: false, isReady: true,
          });
        }
        return;
      }

      let profileData = null;
      let fetchSuccess = false;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const fetchProfile = supabase
            .from('profiles')
            .select('*')
            .eq('auth_id', session.user.id)
            .maybeSingle();

          const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('TIMEOUT')), 5000)
          );

          const res = await Promise.race([fetchProfile, timeout]);

          if (res.error) throw res.error;
          
          profileData = res.data;
          fetchSuccess = true;
          break; 
        } catch (error) {
          console.warn(`Profile fetch attempt ${attempt + 1} failed:`, error);
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 1000)); 
          }
        }
      }

      if (mounted) {
        setAuthState({
          session,
          user: session.user,
          profile: fetchSuccess ? (profileData ?? null) : null,
          profileError: !fetchSuccess,
          isAuthenticated: true,
          isReady: true,
        });
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveAuthState(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // FIX 1: Never ignore INITIAL_SESSION. Only ignore background token refreshes.
      if (event === 'TOKEN_REFRESHED') return;
      
      // FIX 2: Suspend UI on both sign in and sign out transitions to prevent UI leaks.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        if (mounted) setAuthState(prev => ({ ...prev, isReady: false }));
      }
      
      resolveAuthState(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ ...authState, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);