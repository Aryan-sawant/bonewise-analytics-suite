
export interface User {
  id: string;
  email: string;
  name?: string;
  userType: 'common' | 'doctor';
  created_at?: string; // Add this field to fix the error
  // Additional user properties can be added here
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, userType: 'common' | 'doctor', name?: string) => Promise<void>;
  logout: () => void;
  setUser?: (user: User) => void; // Add this optional method to fix the error
}
