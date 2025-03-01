
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  userType: 'common' | 'doctor';
}

export interface AuthFormsProps {
  defaultTab?: 'login' | 'signup';
}
