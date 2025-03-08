import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Bone,
  FlaskConical,
  ActivitySquare,
  BarChart4,
  CalendarDays,
  Spline,
  Skull,
  Microscope
} from 'lucide-react';

const TaskSelector = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const analysisOptions = [
    {
      id: 'fracture-detection',
      title: 'Bone Fracture Detection',
      description: 'AI detects fractures in bones from X-ray images, aiding diagnosis.',
      icon: <Bone className="h-10 w-10 text-primary" />,
    },
    {
      id: 'bone-marrow',
      title: 'Bone Marrow Analysis',
      description: 'Classifies bone marrow cells from microscope images, assisting in hematology.',
      icon: <Microscope className="h-10 w-10 text-primary" />,
    },
    {
      id: 'osteoarthritis',
      title: 'Knee Osteoarthritis Check',
      description: 'Evaluates knee osteoarthritis severity from X-rays or MRIs for joint health.',
      icon: <ActivitySquare className="h-10 w-10 text-primary" />,
    },
    {
      id: 'osteoporosis',
      title: 'Osteoporosis Risk Assessment',
      description: 'Determines osteoporosis stage and BMD score from bone scans for bone strength.',
      icon: <BarChart4 className="h-10 w-10 text-primary" />,
    },
    {
      id: 'bone-age',
      title: 'Pediatric Bone Age Detection',
      description: 'Predicts bone age from hand X-rays, crucial for monitoring child growth.',
      icon: <CalendarDays className="h-10 w-10 text-primary" />,
    },
    {
      id: 'spine-fracture',
      title: 'Cervical Fracture Scan',
      description: 'Identifies fractures in the cervical spine from medical imaging for trauma cases.',
      icon: <Spline className="h-10 w-10 text-primary" />,
    },
    {
      id: 'bone-tumor',
      title: 'Bone Tumor Screening',
      description: 'Screens for bone tumors or cancerous growths from various imaging modalities.',
      icon: <Skull className="h-10 w-10 text-primary" />,
    },
    {
      id: 'bone-infection',
      title: 'Osteomyelitis Detection',
      description: 'Detects bone infections (osteomyelitis) using imaging and biopsy analysis.',
      icon: <FlaskConical className="h-10 w-10 text-primary" />,
    },
  ];

  const handleAnalysisSelect = (analysisId: string) => {
    navigate(`/analysis/${analysisId}`);
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <Button
        variant="outline"
        onClick={() => navigate('/tasks')}
        className="mb-8 transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-lg"
      >
        ← Back to Dashboard
      </Button>

      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight animate-slide-in mb-3" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)', color: 'black' }}> {/* Removed Emoji and Set Color to Black */}
          AI-Powered Medical Image Analysis
        </h1>
        <p className="text-muted-foreground text-lg animate-fade-in">
          Select the type of bone health analysis you wish to perform. Each option utilizes advanced AI for accurate results.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {analysisOptions.map((option) => (
          <Card key={option.id} className="transition-all duration-300 hover:shadow-xl transform hover:translate-z-0 hover:scale-103 rounded-lg border-primary-foreground/10 bg-primary text-primary-foreground"> {/* Set bg-primary for blue background */}
            <CardHeader className="pb-2">
              <div className="mb-3">{option.icon}</div>
              <CardTitle className="text-lg font-semibold">{option.title}</CardTitle>
              <CardDescription className="text-sm text-primary-foreground/80 mt-2">{option.description}</CardDescription> {/* Changed description color to text-primary-foreground/80 for better contrast on blue */}
            </CardHeader>
            <CardFooter className="pt-4">
              <Button
                className="w-full rounded-md transition-all duration-300 hover:shadow-lg active:scale-95 transform hover:translate-z-0 hover:scale-105"
                onClick={() => handleAnalysisSelect(option.id)}
              >
                Analyze Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TaskSelector;
