
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
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-800 to-indigo-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-indigo-800/80 z-0"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgzMCkiPjxwYXRoIGQ9Ik0tMTAgMzBsMjAgLTUwTDMwIDMweiIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIgb3BhY2l0eT0iMC4zIi8+PC9zdmc+')]"></div>
        <div className="animate-float absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/30 rounded-full filter blur-3xl"></div>
        <div className="animate-float absolute -bottom-32 -right-32 w-80 h-80 bg-blue-500/30 rounded-full filter blur-3xl"></div>
        
        <div className="relative z-10 max-w-lg mx-auto text-white space-y-6 animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">BoneHealthAISuite</h1>
          <p className="text-xl opacity-90 text-blue-100 leading-relaxed">
            Advanced bone health analysis powered by artificial intelligence. 
            Sign in to access your personalized bone health insights.
          </p>
          <div className="flex flex-col space-y-4 mt-8">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500/20 p-2 rounded-full">
                <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-blue-100">AI-powered analysis of X-rays and scans</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500/20 p-2 rounded-full">
                <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-blue-100">Secure and private medical data handling</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500/20 p-2 rounded-full">
                <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-blue-100">Personalized health recommendations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Auth forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl animate-fade-in-up">
          {/* Welcome header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to your account to continue</p>
          </div>

          {/* Custom tabs implementation for Login/Sign Up */}
          <Tabs defaultValue={tab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">Login</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="animate-fade-in">
              <LoginForm />
            </TabsContent>
            
            <TabsContent value="signup" className="animate-fade-in">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
