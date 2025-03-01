
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { useAuthContext } from "@/contexts/AuthContext";
import { SignupFormData } from './types';

const SignupForm = () => {
  const navigate = useNavigate();
  const { signup } = useAuthContext();
  const [signupData, setSignupData] = useState<SignupFormData>({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    userType: 'common' as 'common' | 'doctor'
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupData.email || !signupData.password || !signupData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (signupData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      setIsLoading(true);
      await signup(signupData.email, signupData.password, signupData.userType);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Signup failed. Please try again.');
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-card">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your details to create your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignupSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input 
              id="signup-email" 
              type="email" 
              placeholder="example@email.com"
              value={signupData.email}
              onChange={(e) => setSignupData({...signupData, email: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input 
              id="signup-password" 
              type="password" 
              placeholder="••••••••"
              value={signupData.password}
              onChange={(e) => setSignupData({...signupData, password: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-confirm-password">Confirm Password</Label>
            <Input 
              id="signup-confirm-password" 
              type="password" 
              placeholder="••••••••"
              value={signupData.confirmPassword}
              onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>User Type</Label>
            <div className="flex space-x-4 pt-1">
              <Button
                type="button"
                variant={signupData.userType === 'common' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSignupData({...signupData, userType: 'common'})}
                className="flex-1"
              >
                Common User
              </Button>
              <Button
                type="button"
                variant={signupData.userType === 'doctor' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSignupData({...signupData, userType: 'doctor'})}
                className="flex-1"
              >
                Doctor
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SignupForm;
