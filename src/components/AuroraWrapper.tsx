
import { FC, ReactNode } from 'react';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { NavBarDemo } from '@/components/ui/navbar-demo';

interface AuroraWrapperProps {
  children: ReactNode;
}

// This component can be used to wrap any page content with the Aurora background
const AuroraWrapper: FC<AuroraWrapperProps> = ({ children }) => {
  return (
    <AuroraBackground>
      <div className="min-h-screen w-full overflow-y-auto">
        {children}
        <NavBarDemo />
      </div>
    </AuroraBackground>
  );
};

export default AuroraWrapper;
