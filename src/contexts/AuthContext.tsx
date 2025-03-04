
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
      
      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Display the error message
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
          // Continue even if profile fetch fails
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
      // Error toast is already shown above
    } finally {
      setLoading(false);
    }
  };

  // Signup function using Supabase authentication
  const signup = async (
    email: string, 
    password: string, 
    userType: 'common' | 'doctor',
    name?: string
  ): Promise<void> => {
    try {
      setLoading(true);
      
      // Sign up with email and password
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType,
            name,
          },
          // Disable email confirmation requirement
          emailRedirectTo: window.location.origin + '/auth'
        },
      });
      
      if (error) {
        toast.error(`Signup failed: ${error.message}`);
        throw error;
      }
      
      if (data?.user) {
        // Create user profile with name if provided
        if (name) {
          await supabase
            .from('profiles')
            .update({ name })
            .eq('id', data.user.id);
        }
        
        // Skip email verification and log user in directly
        if (data.session) {
          const userProfile: User = {
            id: data.user.id,
            email: data.user.email || '',
            name,
            userType,
          };
          
          setUser(userProfile);
          toast.success('Account created successfully');
          navigate('/tasks');
        } else {
          // If for some reason session is null, redirect to login
          toast.success('Account created! Please log in with your credentials.');
          navigate('/auth?tab=login');
        }
      }
    } catch (error) {
      console.error('Signup failed:', error);
      // Error toast is already shown above
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
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
