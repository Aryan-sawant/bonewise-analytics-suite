// src/pages/Auth.jsx (or .tsx)

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

  useEffect(() => {
    if (user) {
      navigate('/tasks');
    }
  }, [user, navigate]);

  return (
    <AuroraBackground>
      {/*
        Main container:
        - Ensures full screen coverage for the background.
        - Centers the content block (`items-center justify-center`).
        - `p-4` adds padding on small screens so the card doesn't touch edges.
      */}
      <div className="relative flex min-h-screen w-full items-center justify-center p-4 animate-fade-in">

        {/*
          Content Block Container (The Card):
          - `w-full max-w-screen-lg`: Limits width, prevents excessive stretching.
          - `h-auto md:h-[85vh]`: **KEY CHANGE**:
            - `h-auto`: On mobile, let height be determined by content.
            - `md:h-[85vh]`: On medium screens+, set height to 85% of the viewport height. This makes the card taller and adaptive to screen size. Adjust 85vh if needed (e.g., 80vh, 90vh).
          - `flex flex-col md:flex-row`: Standard responsive layout.
          - `overflow-hidden`: Prevents children from visually spilling out.
          - `rounded-lg shadow-xl bg-background`: Styling.
        */}
        <div className="flex w-full max-w-screen-lg h-auto md:h-[85vh] flex-col md:flex-row overflow-hidden rounded-lg shadow-xl bg-background">

          {/* Left Side (Gradient Background) */}
          {/* `md:h-full` ensures it fills the height of the parent content block on desktop */}
          <div className="relative md:w-1/2 h-48 md:h-full bg-gradient-to-r from-purple-900 to-indigo-800 flex items-center justify-center p-8 overflow-hidden">
            <div className="absolute inset-0 opacity-5 pattern-grid-lg"></div>
            <div className="relative z-10 text-white max-w-md text-center md:text-left animate-slide-in">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">BoneHealthAISuite</h2>
              <p className="text-white/80 text-sm md:text-base delay-100">
                Advanced bone health analysis powered by artificial intelligence. Sign in to access your personalized bone health insights.
              </p>
            </div>
          </div>

          {/* Right Side (Auth Forms) */}
          {/*
            - `md:h-full`: Ensures it fills the height of the parent content block on desktop.
            - `overflow-y-auto`: **STILL IMPORTANT**. If the form content *itself* is taller than the available space (even 85vh), this allows the form area *only* to scroll, preventing the whole page from scrolling or breaking layout.
            - Added `flex-1` for mobile to ensure it takes available space below the header.
          */}
          <div className="md:w-1/2 h-full flex flex-1 flex-col items-center justify-center p-6 md:p-8 overflow-y-auto">
            <div className="w-full max-w-md space-y-6 animate-scale-in">
              <div className="text-center md:text-left space-y-2">
                <h1 className="text-2xl font-bold tracking-tight animate-fade-in">Welcome</h1>
                <p className="text-muted-foreground animate-fade-in delay-100">
                  {tab === 'signup' ? 'Create an account to get started' : 'Sign in to your account'}
                </p>
              </div>
              {/* Added min-h-0 here if AuthForms uses flex internally and might cause overflow issues */}
              <div className="min-h-0">
                 <AuthForms defaultTab={tab} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </AuroraBackground>
  );
};

export default Auth;
