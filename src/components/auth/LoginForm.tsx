
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { useAuthContext } from "@/contexts/AuthContext";
import { LoginFormData } from './types';
import { Eye, EyeOff, LogIn } from 'lucide-react';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuthContext();
  const [loginData, setLoginData] = useState<LoginFormData>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      await login(loginData.email, loginData.password);
      // Redirect is handled in the AuthContext
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <Card className="border shadow-md">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Login to your account to continue
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLoginSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input 
              id="login-email" 
              type="email" 
              placeholder="example@email.com" 
              value={loginData.email}
              onChange={(e) => setLoginData({...loginData, email: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
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
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'} 
            <LogIn size={16} className="ml-2" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default LoginForm;
