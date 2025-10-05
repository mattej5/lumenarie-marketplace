'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { User } from '@/lib/types';
import { mockUsers } from '@/lib/mockData';
import { supabase } from '@/lib/supabase/client';
import { shouldUseMockAuth, shouldUseRealAuth, ENABLE_MOCK_AUTH } from '@/lib/utils/env';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setMockUser: (userId: string) => void; // Only available in dev
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const useMockAuth = shouldUseMockAuth();
  const useRealAuth = shouldUseRealAuth();

  // Fetch profile from Supabase
  const fetchProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    if (!supabase) {
      console.log('[AuthContext] No supabase client');
      return null;
    }

    console.log('[AuthContext] Fetching profile for user:', supabaseUser.id);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error || !data) {
      console.error('[AuthContext] Error fetching profile:', error);
      return null;
    }

    console.log('[AuthContext] Profile fetched successfully:', data);

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      avatar: data.avatar,
      createdAt: new Date(data.created_at),
    };
  };

  useEffect(() => {
    // Initialize auth based on environment
    const initAuth = async () => {
      console.log('[AuthContext] Initializing auth. useRealAuth:', useRealAuth, 'useMockAuth:', useMockAuth);

      try {
        if (useRealAuth && supabase) {
          // Real Supabase auth
          console.log('[AuthContext] Getting session...');
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            console.error('[AuthContext] Session error:', sessionError);
            setIsLoading(false);
            return;
          }

          if (session?.user) {
            console.log('[AuthContext] Session found:', session.user.id);
            const profile = await fetchProfile(session.user);
            setUser(profile);
            console.log('[AuthContext] User set:', profile);
          } else {
            console.log('[AuthContext] No session found');
          }

          // Listen for auth changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              console.log('[AuthContext] Auth state changed:', event, session?.user?.id);
              if (session?.user) {
                const profile = await fetchProfile(session.user);
                setUser(profile);
                console.log('[AuthContext] User updated:', profile);
              } else {
                console.log('[AuthContext] User cleared');
                setUser(null);
              }
            }
          );

          setIsLoading(false);
          console.log('[AuthContext] Auth initialized');
          return () => subscription.unsubscribe();
        } else if (useMockAuth) {
          // Mock auth (development fallback)
          console.log('[AuthContext] Using mock auth');
          const storedUserId = localStorage.getItem('mockUserId');
          if (storedUserId) {
            const foundUser = mockUsers.find(u => u.id === storedUserId);
            if (foundUser) {
              setUser(foundUser);
              console.log('[AuthContext] Mock user set:', foundUser.id);
            }
          }
          setIsLoading(false);
        } else {
          console.log('[AuthContext] No auth method configured');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
        setIsLoading(false);
      }
    };

    initAuth();
  }, [useRealAuth, useMockAuth]);

  const signIn = useCallback(async (email: string) => {
    setIsLoading(true);

    if (useRealAuth && supabase) {
      // Real Supabase email/password auth
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'temporary-password', // You'll want to collect this from user
      });

      if (error) {
        console.error('Sign in error:', error);
        setIsLoading(false);
        throw error;
      }
    } else {
      // Mock auth
      await new Promise(resolve => setTimeout(resolve, 500));
      const foundUser = mockUsers.find(u => u.email === email) || mockUsers.find(u => u.role === 'student');
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('mockUserId', foundUser.id);
      }
    }

    setIsLoading(false);
  }, [useRealAuth]);

  const signInWithGoogle = useCallback(async () => {
    if (useRealAuth && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Google sign in error:', error);
        throw error;
      }
    } else {
      // In mock mode, just sign in as first user
      await signIn('teacher@lumenarie.edu');
    }
  }, [useRealAuth, signIn]);

  const signOut = useCallback(async () => {
    // Optimistic: immediately clear user so UI updates even if network lags
    setIsLoading(true);
    setUser(null);
    try {
      if (useRealAuth && supabase) {
        await supabase.auth.signOut();
      } else {
        // Mock delay to simulate network, still already cleared
        await new Promise(resolve => setTimeout(resolve, 150));
        localStorage.removeItem('mockUserId');
      }
    } catch (e) {
      console.error('[AuthContext] signOut error', e);
    } finally {
      setIsLoading(false);
    }
  }, [useRealAuth]);

  const setMockUser = (userId: string) => {
    // Only allow in development
    if (!ENABLE_MOCK_AUTH) {
      console.warn('Mock auth is disabled in production');
      return;
    }

    const foundUser = mockUsers.find(u => u.id === userId);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('mockUserId', foundUser.id);
    }
  };

  const contextValue = useMemo(() => ({ user, isLoading, signIn, signInWithGoogle, signOut, setMockUser }), [user, isLoading, signIn, signInWithGoogle, signOut]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
