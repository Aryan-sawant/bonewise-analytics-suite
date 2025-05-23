
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { useAuthContext } from "@/contexts/AuthContext";
import { SignupFormData } from './types';
import { Eye, EyeOff, User, UserCog, Loader2 } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

const SignupForm = () => {
  const { signup, loginWithGoogle, loading } = useAuthContext();
  const [signupData, setSignupData] = useState<SignupFormData>({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    userType: 'common',
    name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
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

  const handleGoogleSignup = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      // Redirect is handled automatically
    } catch (error: any) {
      console.error('Google signup error:', error);
      setError(error.message || 'Failed to sign up with Google. Please try again.');
    } finally {
      setIsGoogleLoading(false);
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
          
          <div className="relative animate-slide-in delay-400">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 animate-slide-in delay-450"
            onClick={handleGoogleSignup}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
            )}
            Sign up with Google
          </Button>
        </CardContent>
      </form>
    </Card>
  );
};

export default SignupForm;
