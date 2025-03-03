
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { useAuthContext } from "@/contexts/AuthContext";
import { SignupFormData } from './types';
import { Eye, EyeOff, User } from 'lucide-react';

const SignupForm = () => {
  const navigate = useNavigate();
  const { signup, loading } = useAuthContext();
  const [signupData, setSignupData] = useState<SignupFormData>({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    userType: 'common',
    name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupData.email || !signupData.password || !signupData.confirmPassword) {
      toast.error('Please fill in all required fields');
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
      await signup(signupData.email, signupData.password, signupData.userType, signupData.name);
      // Redirect is handled in the AuthContext
    } catch (error) {
      console.error('Signup error:', error);
    }
  };

  return (
    <Card className="border shadow-md">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your details to create your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignupSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name">Name (Optional)</Label>
            <Input 
              id="signup-name" 
              type="text" 
              placeholder="Your name" 
              value={signupData.name}
              onChange={(e) => setSignupData({...signupData, name: e.target.value})}
            />
          </div>
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
            <div className="relative">
              <Input 
                id="signup-password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                value={signupData.password}
                onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-confirm-password">Confirm Password</Label>
            <Input 
              id="signup-confirm-password" 
              type={showPassword ? "text" : "password"} 
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'} 
            <User size={16} className="ml-2" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SignupForm;
