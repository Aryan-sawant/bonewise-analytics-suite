
// src/pages/Auth.jsx (or .tsx)

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthForms from '@/components/auth/AuthForms';
import { useAuthContext } from '@/contexts/AuthContext';
import { AuroraBackground } from "@/components/ui/aurora-background";
import { NavBarDemo } from '@/components/ui/navbar-demo';

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
    <AuroraBackground>
      <div className="relative flex min-h-screen w-full items-center justify-center p-4">
        <div className="flex w-full max-w-screen-md h-auto md:min-h-[600px] flex-col md:flex-row overflow-hidden rounded-lg shadow-xl bg-background">
          {/* Left Side (Gradient Background) */}
          <div className="relative md:w-1/2 h-48 md:h-auto bg-gradient-to-r from-purple-900 to-indigo-800 flex items-center justify-center p-8 overflow-hidden">
            <div className="absolute inset-0 opacity-5 pattern-grid-lg"></div>
            <div className="relative z-10 text-white max-w-md text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">BoneHealthAISuite</h2>
              <p className="text-white/80 text-sm md:text-base">
                Advanced bone health analysis powered by artificial intelligence. Sign in to access your personalized bone health insights.
              </p>
            </div>
          </div>

          {/* Right Side (Auth Forms) */}
          <div className="md:w-1/2 flex-1 flex flex-col items-center justify-center p-6 md:p-8 overflow-y-auto">
            <div className="w-full max-w-md space-y-6">
              <div className="text-center md:text-left space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Welcome</h1>
                <p className="text-muted-foreground">
                  {tab === 'signup' ? 'Create an account to get started' : 'Sign in to your account'}
                </p>
              </div>
              <div>
                 <AuthForms defaultTab={tab} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <NavBarDemo />
    </AuroraBackground>
  );
};

export default Auth;
