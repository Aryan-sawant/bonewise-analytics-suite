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
    // Wrap with AuroraBackground
    <AuroraBackground>
      {/*
        Main container:
        - `relative`: Establishes a positioning context, often needed for background components.
        - `flex`: Enable flexbox.
        - `min-h-screen`: Ensure it takes at least the full viewport height.
        - `w-full`: Ensure it takes the full viewport width.
        - `items-center justify-center`: Center the content block vertically and horizontally.
        - `overflow-hidden`: Crucial change - prevents content from spilling outside and breaking layout.
      */}
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden animate-fade-in p-4 md:p-0"> {/* Added padding for small screens */}

        {/*
          Content Block Container:
          - `flex`: Enable flexbox for columns.
          - `w-full`: Take full width *of the centered container*.
          - `max-w-screen-lg`: Limit the maximum width on large screens (adjust as needed, e.g., xl).
          - `h-auto md:h-[80vh]`: Let height be auto on mobile, fix to a portion of viewport height on desktop. Adjust vh as needed.
          - `flex-col md:flex-row`: The responsive column/row layout.
          - `overflow-hidden`: Prevent internal content spill.
          - `rounded-lg shadow-xl`: Optional nice styling.
        */}
        <div className="flex w-full max-w-screen-lg h-auto md:h-[550px] flex-col md:flex-row overflow-hidden rounded-lg shadow-xl bg-background"> {/* Added bg-background as fallback */}

          {/* Left Side (Gradient Background) */}
          {/* Adjusted height handling for flex context */}
          <div className="relative md:w-1/2 h-48 md:h-full bg-gradient-to-r from-purple-900 to-indigo-800 flex items-center justify-center p-8 overflow-hidden animate-fade-in">
            <div className="absolute inset-0 opacity-5 pattern-grid-lg"></div>
            {/* Ensure text content is relatively positioned to be above the pattern */}
            <div className="relative z-10 text-white max-w-md text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 animate-slide-in">BoneHealthAISuite</h2>
              <p className="text-white/80 text-sm md:text-base animate-slide-in delay-100">
                Advanced bone health analysis powered by artificial intelligence. Sign in to access your personalized bone health insights.
              </p>
            </div>
          </div>

          {/* Right Side (Auth Forms) */}
          {/* Ensure it fills height in flex row layout */}
          <div className="md:w-1/2 h-full flex flex-col items-center justify-center p-6 md:p-8 overflow-y-auto"> {/* Added overflow-y-auto for form content */}
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
