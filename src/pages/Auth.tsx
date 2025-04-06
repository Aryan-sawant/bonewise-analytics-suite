
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthForms from '@/components/auth/AuthForms';
import { useAuthContext } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';

const Auth = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get('tab') as 'login' | 'signup' || 'login';

  useEffect(() => {
    if (user) {
      navigate('/tasks');
    }
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen">
      {/* Left side: Gradient background with app info */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-purple-900 to-indigo-800 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20 z-0"></div>
        <div className="relative z-10 max-w-lg mx-auto text-white space-y-6">
          <h1 className="text-4xl font-bold">BoneHealthAISuite</h1>
          <p className="text-xl opacity-90">
            Advanced bone health analysis powered by artificial intelligence. 
            Sign in to access your personalized bone health insights.
          </p>
        </div>
      </div>

      {/* Right side: Auth forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          {/* Welcome header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome</h2>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {/* Custom tabs implementation for Login/Sign Up */}
          <Tabs defaultValue={tab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            
            <TabsContent value="signup">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
