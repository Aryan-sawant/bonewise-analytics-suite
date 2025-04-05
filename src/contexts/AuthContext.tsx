
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, AuthContextType } from '@/types/auth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Create context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data?.session) {
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData?.user) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userData.user.id)
              .single();
            
            const userWithProfile: User = {
              id: userData.user.id,
              email: userData.user.email || '',
              name: profileData?.name || undefined,
              userType: profileData?.user_type as 'common' | 'doctor',
            };
            
            setUser(userWithProfile);
          }
        }
      } catch (error) {
        console.error('Failed to restore user session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  // Login function using Supabase authentication
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      console.log('Attempting login with:', email);
      
      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Login error:', error);
        toast.error(`Login failed: ${error.message}`);
        throw error;
      }
      
      if (data?.user) {
        // Fetch user profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }
        
        const userWithProfile: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: profileData?.name || undefined,
          userType: profileData?.user_type as 'common' | 'doctor',
        };
        
        setUser(userWithProfile);
        toast.success('Logged in successfully');
        navigate('/tasks');
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Google login function
  const loginWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log('Attempting Google login');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`
        }
      });
      
      if (error) {
        console.error('Google login error:', error);
        toast.error(`Google login failed: ${error.message}`);
        throw error;
      }
      
      // The redirect will happen automatically, so we don't need to do anything else here
      console.log('Google auth initiated:', data);
    } catch (error) {
      console.error('Google login failed:', error);
      toast.error('Failed to login with Google');
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth callback
  const handleAuthCallback = async (): Promise<void> => {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth callback error:', error);
      toast.error(`Authentication failed: ${error.message}`);
      return;
    }
    
    if (data?.session) {
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData?.user) {
        // Check if profile exists first
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();
          
        console.log('Existing profile check:', existingProfile, profileCheckError);
        
        // Only create profile if it doesn't exist
        if (!existingProfile && (profileCheckError?.code === 'PGRST116' || profileCheckError?.message?.includes('No rows found'))) {
          const defaultUserType = 'common';
          const userName = userData.user.user_metadata?.full_name || 
                          userData.user.user_metadata?.name || '';
                          
          console.log('Creating new profile for user:', userData.user.id, userName);
          
          // Use auth.uid() explicitly for the user ID to ensure RLS compliance
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([
              {
                id: userData.user.id,
                email: userData.user.email,
                name: userName,
                user_type: defaultUserType
              }
            ])
            .select()
            .single();
              
          if (insertError) {
            console.error('Error creating profile:', insertError);
            toast.error(`Failed to create user profile: ${insertError.message}`);
            
            // Try to debug by checking what we attempted to insert
            console.log('Attempted to insert profile:', {
              id: userData.user.id,
              email: userData.user.email,
              name: userName,
              user_type: defaultUserType
            });
          } else {
            console.log('Profile created successfully:', newProfile);
            toast.success('Profile created successfully');
          }
        }
        
        // Get the profile data whether it was just created or already existed
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();
        
        const userProfile: User = {
          id: userData.user.id,
          email: userData.user.email || '',
          name: userData.user.user_metadata?.full_name || 
                userData.user.user_metadata?.name || 
                profileData?.name,
          userType: profileData?.user_type as 'common' | 'doctor' || 'common',
        };
        
        setUser(userProfile);
        toast.success('Logged in successfully');
        navigate('/tasks');
      }
    }
  };

  // Check for OAuth callback on component mount
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    
    if (hashParams.get('access_token') || queryParams.get('code')) {
      handleAuthCallback();
    }
  }, []);

  // Signup function using Supabase authentication
  const signup = async (
    email: string, 
    password: string, 
    userType: 'common' | 'doctor',
    name?: string
  ): Promise<void> => {
    try {
      setLoading(true);
      console.log('Attempting signup with:', email, 'user type:', userType);

      // Sign up with email and password
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType,
            name,
          },
        },
      });
      
      if (error) {
        console.error('Signup error:', error);
        toast.error(`Signup failed: ${error.message}`);
        throw error;
      }
      
      if (data?.user) {
        console.log('User created:', data.user);
        
        // Create user profile with the service_role client or rely on the trigger
        try {
          // Use direct insert for creating the profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                email: data.user.email,
                name: name || '',
                user_type: userType
              }
            ]);

          if (profileError) {
            console.error('Error creating profile:', profileError);
            toast.error(`Failed to create user profile: ${profileError.message}`);
            // Continue anyway as the user was created successfully
          } else {
            console.log('Profile created successfully for user:', data.user.id);
          }
        } catch (profileError) {
          console.error('Exception creating profile:', profileError);
          // Continue anyway as the user was created successfully
        }

        const userProfile: User = {
          id: data.user.id,
          email: data.user.email || '',
          name,
          userType,
        };
        
        setUser(userProfile);
        toast.success('Account created successfully');
        navigate('/tasks');
      }
    } catch (error: any) {
      console.error('Signup failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error(`Logout failed: ${error.message}`);
        throw error;
      }
      
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Provide the auth context to children components
  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
