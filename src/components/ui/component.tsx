
import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function AuroraBackground({
  children,
  className,
}: AuroraBackgroundProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 z-0">
        <div className="relative h-full w-full">
          <div className="aurora-blur-1 absolute top-[-10%] left-[-10%] h-[40%] w-[60%] rounded-full bg-purple-400/30 blur-[90px]" />
          <div className="aurora-blur-2 absolute top-[20%] right-[-10%] h-[40%] w-[60%] rounded-full bg-blue-400/20 blur-[90px]" />
          <div className="aurora-blur-3 absolute bottom-[-5%] left-[20%] h-[40%] w-[50%] rounded-full bg-indigo-400/20 blur-[90px]" />
        </div>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
