import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { useAuthContext } from "@/contexts/AuthContext";
import { LoginFormData } from './types';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loading } = useAuthContext();
  const [loginData, setLoginData] = useState<LoginFormData>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!loginData.email || !loginData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      await login(loginData.email, loginData.password);
      // Redirect is handled in the AuthContext
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      // Redirect is handled automatically
    } catch (error: any) {
      console.error('Google login error:', error);
      setError(error.message || 'Failed to login with Google. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="border shadow-md animate-scale-in">
      <CardHeader>
        <CardTitle className="animate-fade-in">Welcome back</CardTitle>
        <CardDescription className="animate-fade-in delay-75">
          Login to your account to continue
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLoginSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm animate-fade-in">
              {error}
            </div>
          )}
          
          <div className="space-y-2 animate-slide-in delay-100">
            <Label htmlFor="login-email">Email</Label>
            <Input 
              id="login-email" 
              type="email" 
              placeholder="example@email.com" 
              value={loginData.email}
              onChange={(e) => setLoginData({...loginData, email: e.target.value})}
              required
              className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-2 animate-slide-in delay-150">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">Password</Label>
              <Button 
                variant="link" 
                size="sm" 
                className="px-0 text-xs text-muted-foreground h-auto" 
                tabIndex={-1}
                type="button"
              >
                Forgot password?
              </Button>
            </div>
            <div className="relative">
              <Input 
                id="login-password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                required
                className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
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
          
          <Button 
            type="submit" 
            className="w-full transition-all duration-300 hover:bg-primary/90 animate-slide-in delay-200" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                Login
                <LogIn size={16} className="ml-2" />
              </>
            )}
          </Button>
          
          <div className="relative animate-slide-in delay-250">
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
            className="w-full flex items-center justify-center gap-2 animate-slide-in delay-300"
            onClick={handleGoogleLogin}
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
            Sign in with Google
          </Button>
        </CardContent>
      </form>
    </Card>
  );
};

export default LoginForm;
