
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { useAuthContext } from "@/contexts/AuthContext";
import { SignupFormData } from './types';
import { Eye, EyeOff, User, UserCog, Loader2 } from 'lucide-react';

const SignupForm = () => {
  const { signup, loading } = useAuthContext();
  const [signupData, setSignupData] = useState<SignupFormData>({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    userType: 'common',
    name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
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
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    }
  };

  return (
    <Card className="border shadow-md animate-scale-in">
      <CardHeader>
        <CardTitle className="animate-fade-in">Create an account</CardTitle>
        <CardDescription className="animate-fade-in delay-75">
          Enter your details to create your BoneHealthAI account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignupSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm animate-fade-in">
              {error}
            </div>
          )}

          <div className="space-y-2 animate-slide-in delay-100">
            <Label htmlFor="signup-name">Name (Optional)</Label>
            <Input 
              id="signup-name" 
              type="text" 
              placeholder="Your name" 
              value={signupData.name}
              onChange={(e) => setSignupData({...signupData, name: e.target.value})}
            />
          </div>
          <div className="space-y-2 animate-slide-in delay-150">
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
          <div className="space-y-2 animate-slide-in delay-200">
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
          <div className="space-y-2 animate-slide-in delay-250">
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
          <div className="space-y-2 animate-slide-in delay-300">
            <Label>Account Type</Label>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <Button
                type="button"
                variant={signupData.userType === 'common' ? 'default' : 'outline'}
                onClick={() => setSignupData({...signupData, userType: 'common'})}
                className="w-full h-24 flex flex-col items-center justify-center space-y-2 transition-all duration-300 hover:scale-105"
              >
                <User size={24} />
                <div className="text-sm">Common User</div>
              </Button>
              <Button
                type="button"
                variant={signupData.userType === 'doctor' ? 'default' : 'outline'}
                onClick={() => setSignupData({...signupData, userType: 'doctor'})}
                className="w-full h-24 flex flex-col items-center justify-center space-y-2 transition-all duration-300 hover:scale-105"
              >
                <UserCog size={24} />
                <div className="text-sm">Doctor</div>
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full transition-all duration-300 hover:bg-primary/90 animate-slide-in delay-350" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create account
                <User size={16} className="ml-2" />
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SignupForm;
