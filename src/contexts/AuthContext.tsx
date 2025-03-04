
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
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        if (error.message === 'Email not confirmed') {
          toast.error('Please check your email and confirm your account before logging in.');
        } else {
          toast.error(`Login failed: ${error.message}`);
        }
        throw error;
      }
      
      if (data?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
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
      // Don't show generic error toast - we handle specific errors above
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
        toast.error(`Signup failed: ${error.message}`);
        throw error;
      }
      
      if (data?.user) {
        // Check if email confirmation is required
        if (data.session === null) {
          toast.success('Account created! Please check your email to confirm your account before logging in.');
          navigate('/auth');
          return;
        }
        
        const userProfile: User = {
          id: data.user.id,
          email: data.user.email || '',
          name,
          userType,
        };
        
        // Update name in profile if provided
        if (name) {
          await supabase
            .from('profiles')
            .update({ name })
            .eq('id', data.user.id);
        }
        
        setUser(userProfile);
        toast.success('Account created successfully');
        navigate('/tasks');
      }
    } catch (error) {
      console.error('Signup failed:', error);
      // Don't show generic error toast - we handle specific errors above
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
