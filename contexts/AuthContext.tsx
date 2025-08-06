import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  enableGuestMode: () => void;
  upgradeGuestToAccount: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting initial session:', error);
          if (mountedRef.current) setLoading(false);
          return;
        }
        
      console.log('Initial session check:', session?.user?.email || 'No session');
      if (mountedRef.current) {
        setSession(session);
        setUser(session?.user ?? null);
      }
      if (session?.user && mountedRef.current) {
          await loadProfile(session.user.id);
      }
      if (mountedRef.current) setLoading(false);
      } catch (error) {
        console.error('Exception getting initial session:', error);
        if (mountedRef.current) setLoading(false);
      }
    };
    
    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Prevent rapid state changes
        if (event === 'TOKEN_REFRESHED') {
          return; // Don't process token refresh events
        }
        
        console.log('Auth state changed:', event, session?.user?.email || 'No user');
        if (mountedRef.current) {
          setSession(session);
          setUser(session?.user ?? null);
        }
        
        if (session?.user && mountedRef.current) {
          await loadProfile(session.user.id);
        } else if (mountedRef.current) {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      console.log('Loading profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Profile not found, will be created by trigger');
          return;
        }
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        console.log('Profile loaded:', data.email);
        if (mountedRef.current) {
          setProfile(data);
        }
      }
    } catch (error) {
      console.error('Error in loadProfile:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      console.log('Attempting to sign up user:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        return { error };
      }

      console.log('Sign up successful:', data.user?.email);
      
      // The profile should be created automatically by the database trigger
      // But let's add a small delay to ensure it's processed
      if (data.user && !data.user.email_confirmed_at) {
        console.log('User created, email confirmation may be required');
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up exception:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in user:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }
      
      console.log('Sign in successful:', data.user?.email);
      return { error: null };
    } catch (error) {
      console.error('Sign in exception:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user');
      
      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        // Don't return error immediately - still clear local state
      }
      
      // Always clear local state regardless of Supabase response
      setUser(null);
      setProfile(null);
      setSession(null);
      
      console.log('✅ Sign out completed');
      return { error };
    } catch (error) {
      console.error('Sign out exception:', error);
      // Clear local state even on exception to prevent stuck states
      setUser(null);
      setProfile(null);
      setSession(null);
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) {
        return { error: new Error('No user logged in') };
      }

      console.log('Updating profile for user:', user.email);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (!error) {
        setProfile(prev => prev ? { ...prev, ...updates } : null);
        console.log('Profile updated successfully');
      } else {
        console.error('Profile update error:', error);
      }

      return { error };
    } catch (error) {
      console.error('Profile update exception:', error);
      return { error };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
