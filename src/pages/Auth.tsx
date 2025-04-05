
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthForms from '@/components/auth/AuthForms';
import { useAuthContext } from '@/contexts/AuthContext';
import { AuroraBackground } from "@/components/ui/aurora-background";

const Auth = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get('tab') as 'login' | 'signup' || 'login';
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/tasks');
    }
  }, [user, navigate]);
  
  return (
    <AuroraBackground>
      <div className="min-h-screen flex flex-col animate-fade-in">
        <div className="flex-1 flex flex-col md:flex-row">
          {/* Gradient Background Side */}
          <div className="md:w-1/2 h-40 md:h-auto bg-gradient-to-r from-purple-900 to-indigo-800 relative overflow-hidden animate-fade-in">
            <div className="absolute inset-0 opacity-5 pattern-grid-lg"></div>
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-white max-w-md text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 animate-slide-in">BoneHealthAISuite</h2>
                <p className="text-white/80 text-sm md:text-base animate-slide-in delay-100">
                  Advanced bone health analysis powered by artificial intelligence. Sign in to access your personalized bone health insights.
                </p>
              </div>
            </div>
          </div>
          
          {/* Auth Forms Side */}
          <div className="md:w-1/2 flex flex-col items-center justify-center p-8 bg-background">
            <div className="w-full max-w-md space-y-6 animate-scale-in">
              <div className="text-center md:text-left space-y-2">
                <h1 className="text-2xl font-bold tracking-tight animate-fade-in">Welcome</h1>
                <p className="text-muted-foreground animate-fade-in delay-100">
                  {tab === 'signup' ? 'Create an account to get started' : 'Sign in to your account'}
                </p>
              </div>
              
              <AuthForms defaultTab={tab} />
            </div>
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
};

export default Auth;
