
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, AuthContextType } from '@/types/auth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
    // In a real app, this would check for a token in localStorage or cookies
    // and validate it with the backend
    const checkExistingSession = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          // Don't automatically navigate on initial load
        }
      } catch (error) {
        console.error('Failed to restore user session:', error);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  // Mock login function (would integrate with backend in real implementation)
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any credentials and create a mock user
      // In a real app, this would validate credentials with a backend
      const mockUser: User = {
        id: 'user-' + Date.now(),
        email,
        userType: email.includes('doctor') ? 'doctor' : 'common',
      };
      
      // Save user to state and localStorage
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      toast.success('Logged in successfully');
      navigate('/tasks');
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Mock signup function
  const signup = async (
    email: string, 
    password: string, 
    userType: 'common' | 'doctor',
    name?: string
  ): Promise<void> => {
    try {
      setLoading(true);
      
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, create a mock user without actual backend registration
      // In a real app, this would send registration data to a backend
      const mockUser: User = {
        id: 'user-' + Date.now(),
        email,
        name,
        userType,
      };
      
      // Save user to state and localStorage
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      toast.success('Account created successfully');
      navigate('/tasks');
    } catch (error) {
      console.error('Signup failed:', error);
      toast.error('Signup failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = (): void => {
    setUser(null);
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  // Provide the auth context to children components
  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
