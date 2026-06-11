import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    session: null,
    user: null,
    profile: null,
    mediaItems: [],
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
          const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('TIMEOUT')), 3000)
          );

          const [profileRes] = await Promise.all([
            Promise.race([
              supabase
                .from('profiles')
                .select('*')
                .eq('auth_id', session.user.id)
                .maybeSingle(),
              timeout
            ]),
            Promise.resolve(null)
          ]);

          if (profileRes.error) throw profileRes.error;
          
          profileData = profileRes.data;
          fetchSuccess = true;
          break; 
        } catch (error) {
          console.warn(`Profile fetch attempt ${attempt + 1} failed:`, error);
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 500)); 
          }
        }
      }

      if (mounted) {
        let mediaData = [];
        if (fetchSuccess && profileData?.id) {
          const { data: media } = await supabase
            .from('media')
            .select('*')
            .eq('profile_id', profileData.id)
            .order('display_order', { ascending: true });
          mediaData = media || [];
        }
        setAuthState({
          session,
          user: session.user,
          profile: fetchSuccess ? (profileData ?? null) : null,
          mediaItems: mediaData,
          profileError: !fetchSuccess,
          isAuthenticated: true,
          isReady: true,
        });
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveAuthState(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle sign-out as the single source of truth for cleanup
      if (event === 'SIGNED_OUT') {
        if (mounted) {
          setAuthState({
            session: null, user: null, profile: null, mediaItems: [],
            profileError: false, isAuthenticated: false, isReady: true,
          });
        }
        window.location.href = '/';
        return;
      }

      if (event === 'TOKEN_REFRESHED') return;

      // Suspend UI on sign-in transitions to prevent flicker
      if (event === 'SIGNED_IN') {
        if (mounted) setAuthState(prev => ({ ...prev, isReady: false }));
      }

      resolveAuthState(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', session.user.id)
        .maybeSingle();
      if (!error) {
        let mediaData = [];
        if (data?.id) {
          const { data: media } = await supabase
            .from('media')
            .select('*')
            .eq('profile_id', data.id)
            .order('display_order', { ascending: true });
          mediaData = media || [];
        }
        setAuthState(prev => ({ ...prev, profile: data ?? null, mediaItems: mediaData, profileError: false }));
      }
    } catch (err) {
      console.warn('refreshProfile failed:', err);
    }
  }, []);

  // signOut only triggers the Supabase call.
  // The onAuthStateChange listener handles state reset + redirect.
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
      // Fallback if Supabase call fails
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);