
import { FC, ReactNode } from 'react';
import { AuroraBackground } from '@/components/ui/aurora-background';
import NavBar from '@/components/NavBar';
import { useLocation } from 'react-router-dom';

interface AuroraWrapperProps {
  children: ReactNode;
}

// This component can be used to wrap any page content with the Aurora background
const AuroraWrapper: FC<AuroraWrapperProps> = ({ children }) => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  
  return (
    <AuroraBackground>
      <div className="min-h-screen w-full overflow-y-auto">
        {isLandingPage && <NavBar />}
        {children}
      </div>
    </AuroraBackground>
  );
};

export default AuroraWrapper;
