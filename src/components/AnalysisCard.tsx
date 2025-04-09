
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Lock } from 'lucide-react';

interface AnalysisCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  disabled?: boolean;
  prompt?: string;
}

const AnalysisCard = ({
  title,
  description,
  icon,
  path,
  color,
  disabled = false,
  prompt
}: AnalysisCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (disabled) return;
    
    if (prompt) {
      // Store the prompt in localStorage to be used in the upload page
      localStorage.setItem('analysisPrompt', prompt);
    }
    
    navigate(path);
  };

  return (
    <Card 
      className={cn(
        "hover-card transition-all duration-300 hover:shadow-xl transform hover:translate-z-0 hover:scale-103 border border-gray-100 bg-white/90 backdrop-blur-sm",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      <CardHeader className="pb-2">
        <div className={cn("mb-2 p-2 rounded-lg inline-flex", color)}>
          {icon}
        </div>
        <CardTitle className="hover-title">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {disabled && (
          <div className="flex items-center text-sm text-muted-foreground bg-muted/20 p-2 rounded-md">
            <Lock className="h-4 w-4 mr-2" />
            <span>Coming soon</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleCardClick} 
          disabled={disabled}
          className="w-full hover-scale transition-all duration-300 hover:shadow-lg active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-xl"
          variant="gradient"
        >
          {disabled ? "Coming Soon" : "Start Analysis"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AnalysisCard;
