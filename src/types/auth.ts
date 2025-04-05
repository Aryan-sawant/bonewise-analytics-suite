
export interface User {
  id: string;
  email: string;
  name?: string;
  userType: 'common' | 'doctor';
  created_at?: string;
  // Additional user properties can be added here
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, userType: 'common' | 'doctor', name?: string) => Promise<void>;
  logout: () => void;
  setUser?: (user: User) => void;
}

// Add a type guard to check if a user is a doctor
export const isDoctor = (user: User | null): boolean => {
  return user?.userType === 'doctor';
};
