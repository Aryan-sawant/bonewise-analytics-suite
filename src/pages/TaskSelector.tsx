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
  const [titleFadeIn, setTitleFadeIn] = React.useState(false);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setTimeout(() => {
      setTitleFadeIn(true);
    }, 100);
  }, [user, navigate]);

  const analysisOptions = [
    {
      id: 'fracture-detection',
      title: 'Bone Fracture Detection',
      description: 'Detect fractures in bones using X-ray images.',
      icon: <Bone className="h-10 w-10 text-primary" />,
    },
    {
      id: 'bone-marrow',
      title: 'Bone Marrow Cell Classification',
      description: 'Analyze bone marrow cells from microscope images.',
      icon: <Microscope className="h-10 w-10 text-primary" />,
    },
    {
      id: 'osteoarthritis',
      title: 'Knee Joint Osteoarthritis',
      description: 'Assess knee joint osteoarthritis from X-ray or MRI.',
      icon: <ActivitySquare className="h-10 w-10 text-primary" />,
    },
    {
      id: 'osteoporosis',
      title: 'Osteoporosis Stage & BMD Score',
      description: 'Evaluate bone density and osteoporosis staging.',
      icon: <BarChart4 className="h-10 w-10 text-primary" />,
    },
    {
      id: 'bone-age',
      title: 'Bone Age Detection',
      description: 'Determine bone age from hand X-ray images.',
      icon: <CalendarDays className="h-10 w-10 text-primary" />,
    },
    {
      id: 'spine-fracture',
      title: 'Cervical Spine Fracture Detection',
      description: 'Detect fractures in the cervical spine.',
      icon: <Spline className="h-10 w-10 text-primary" />,
    },
    {
      id: 'bone-tumor',
      title: 'Bone Tumor/Cancer Detection',
      description: 'Identify potential bone tumors or cancerous lesions.',
      icon: <Skull className="h-10 w-10 text-primary" />,
    },
    {
      id: 'bone-infection',
      title: 'Bone Infection Detection',
      description: 'Detect signs of osteomyelitis or bone infections.',
      icon: <FlaskConical className="h-10 w-10 text-primary" />,
    },
  ];

  const handleAnalysisSelect = (analysisId: string) => {
    navigate(`/analysis/${analysisId}`);
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <style>
        {`
        .hover-scale {
          transition: transform 0.2s ease-out;
        }

        .hover-scale:hover {
          transform: scale(1.05);
        }

        .hover-card {
          transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
        }

        .hover-card:hover {
          transform: translateZ(5px) translateY(-3px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .hover-title {
          transition: color 0.2s ease-out, text-decoration 0.2s ease-out;
        }

        .hover-title:hover {
          color: var(--primary); /* Use primary color on hover */
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .fade-in-title {
          opacity: 0;
          transform: translateY(-10px);
          transition: opacity 0.5s ease-out, transform 0.5s ease-out;
        }

        .fade-in-title.visible {
          opacity: 1;
          transform: translateY(0);
        }
        `}
      </style>
      
      <Button
        variant="outline"
        onClick={() => navigate('/tasks')}
        className="mb-6 hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-lg bg-primary-foreground text-blue-500 border-blue-500 hover:bg-blue-500/10"
      >
        ← Back to Dashboard
      </Button>

      <h1 className={`text-3xl font-bold mb-2 text-primary-foreground ${titleFadeIn ? 'fade-in-title visible' : 'fade-in-title'}`} style={{ color: 'black' }}>Select Analysis Type</h1>
      <p className="text-muted-foreground mb-8 animate-fade-in">
        Choose the type of bone health analysis you would like to perform
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {analysisOptions.map((option) => (
          <Card key={option.id} className="hover-card transition-all duration-300 hover:shadow-xl transform hover:translate-z-0 hover:scale-103 rounded-lg border animate-fade-in">
            <CardHeader className="pb-2">
              <div className="mb-3">{option.icon}</div>
              <CardTitle className="font-semibold text-lg hover-title">{option.title}</CardTitle>
              <CardDescription className="text-muted-foreground text-sm mt-1">{option.description}</CardDescription>
            </CardHeader>
            <CardFooter className="pt-4">
              <Button
                className="w-full hover-scale transition-all duration-300 hover:shadow-lg active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-lg"
                onClick={() => handleAnalysisSelect(option.id)}
              >
                Select
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TaskSelector;
