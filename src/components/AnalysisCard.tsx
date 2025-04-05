
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AnalysisCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color?: string;
  disabled?: boolean;
  prompt?: string; // Add prompt prop
  className?: string;
}

const AnalysisCard = ({
  title,
  description,
  icon,
  path,
  color = "bg-primary/10 text-primary",
  disabled = false,
  prompt, // Include prompt in prop destructuring
  className,
}: AnalysisCardProps) => {
  return (
    <Card className={cn("overflow-hidden transition-all duration-300 hover:shadow-md border", disabled && "opacity-60", className)}>
      <CardHeader className="pb-3">
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-3", color)}>
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p>Upload an image for AI-powered analysis</p>
      </CardContent>
      <CardFooter>
        {disabled ? (
          <Button variant="secondary" className="w-full" disabled>
            Coming Soon
          </Button>
        ) : (
          <Link to={path} className="w-full">
            <Button className="w-full gap-2 justify-between">
              Start Analysis
              <ArrowRight size={16} />
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
};

export default AnalysisCard;
