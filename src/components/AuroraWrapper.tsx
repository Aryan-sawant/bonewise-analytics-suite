
import { FC, ReactNode } from 'react';
import { AuroraBackground } from '@/components/ui/aurora-background';

interface AuroraWrapperProps {
  children: ReactNode;
}

// This component can be used to wrap any page content with the Aurora background
const AuroraWrapper: FC<AuroraWrapperProps> = ({ children }) => {
  return (
    <AuroraBackground>
      <div className="min-h-screen w-full overflow-auto">
        {children}
      </div>
    </AuroraBackground>
  );
};

export default AuroraWrapper;
