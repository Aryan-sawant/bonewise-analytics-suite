// src/pages/Auth.jsx (or .tsx)

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthForms from '@/components/auth/AuthForms'; // Assuming this component exists
import { useAuthContext } from '@/contexts/AuthContext'; // Assuming this context exists
import { AuroraBackground } from "@/components/ui/aurora-background"; // Assuming this UI component exists

const Auth = () => {
  // --- Hooks ---
  const { user } = useAuthContext(); // Get user state from context
  const navigate = useNavigate(); // Hook for programmatic navigation
  const location = useLocation(); // Hook to access the current URL location

  // --- Query Parameter Handling ---
  const searchParams = new URLSearchParams(location.search);
  // Get the 'tab' query parameter, default to 'login' if not present or invalid
  const tab = searchParams.get('tab') as 'login' | 'signup' || 'login';

  // --- Redirect Logic ---
  // If the user is already logged in, redirect them away from the auth page
  useEffect(() => {
    if (user) {
      navigate('/tasks'); // Redirect to the tasks page (or dashboard, etc.)
    }
  }, [user, navigate]); // Dependency array: re-run effect if user or navigate changes

  // --- Render Logic ---
  return (
    // Use the AuroraBackground component for the animated background effect
    <AuroraBackground>
      {/* Main container: ensures minimum full screen height, uses flexbox */}
      <div className="min-h-screen flex flex-col animate-fade-in">

        {/* Content container: takes remaining space, stacks vertically by default, row layout on medium screens+ */}
        <div className="flex-1 flex flex-col md:flex-row">

          {/* Left Side (Gradient Background) - Visible on all screen sizes */}
          {/* Takes full width on small screens (implicit), half width on medium screens+ */}
          {/* Fixed height on small screens, auto height on medium screens+ */}
          <div className="md:w-1/2 h-40 md:h-auto bg-gradient-to-r from-purple-900 to-indigo-800 relative overflow-hidden animate-fade-in">
            {/* Optional pattern overlay */}
            <div className="absolute inset-0 opacity-5 pattern-grid-lg"></div>
            {/* Content centered within the gradient area */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-white max-w-md text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 animate-slide-in">BoneHealthAISuite</h2>
                <p className="text-white/80 text-sm md:text-base animate-slide-in delay-100">
                  Advanced bone health analysis powered by artificial intelligence. Sign in to access your personalized bone health insights.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side (Auth Forms) - Visible on all screen sizes */}
          {/* Takes full width on small screens (implicit), half width on medium screens+ */}
          {/* Centers content vertically and horizontally */}
          <div className="md:w-1/2 flex flex-col items-center justify-center p-8 bg-background">
            {/* Container for the form elements, limiting max width */}
            <div className="w-full max-w-md space-y-6 animate-scale-in">
              {/* Welcome text section */}
              <div className="text-center md:text-left space-y-2">
                <h1 className="text-2xl font-bold tracking-tight animate-fade-in">Welcome</h1>
                <p className="text-muted-foreground animate-fade-in delay-100">
                  {/* Dynamically change text based on the active tab */}
                  {tab === 'signup' ? 'Create an account to get started' : 'Sign in to your account'}
                </p>
              </div>

              {/* Render the AuthForms component, passing the default tab */}
              <AuthForms defaultTab={tab} />
            </div>
          </div>

        </div>
      </div>
    </AuroraBackground>
  );
};

export default Auth;
