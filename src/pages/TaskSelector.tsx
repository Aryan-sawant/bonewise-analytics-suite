
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
  Microscope,
  ArrowLeft
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
      icon: <Bone className="h-10 w-10 text-blue-500" />,
    },
    {
      id: 'bone-marrow',
      title: 'Bone Marrow Cell Classification',
      description: 'Analyze bone marrow cells from microscope images.',
      icon: <Microscope className="h-10 w-10 text-indigo-500" />,
    },
    {
      id: 'osteoarthritis',
      title: 'Knee Joint Osteoarthritis',
      description: 'Assess knee joint osteoarthritis from X-ray or MRI.',
      icon: <ActivitySquare className="h-10 w-10 text-violet-500" />,
    },
    {
      id: 'osteoporosis',
      title: 'Osteoporosis Stage & BMD Score',
      description: 'Evaluate bone density and osteoporosis staging.',
      icon: <BarChart4 className="h-10 w-10 text-purple-500" />,
    },
    {
      id: 'bone-age',
      title: 'Bone Age Detection',
      description: 'Determine bone age from hand X-ray images.',
      icon: <CalendarDays className="h-10 w-10 text-pink-500" />,
    },
    {
      id: 'spine-fracture',
      title: 'Cervical Spine Fracture Detection',
      description: 'Detect fractures in the cervical spine.',
      icon: <Spline className="h-10 w-10 text-red-500" />,
    },
    {
      id: 'bone-tumor',
      title: 'Bone Tumor/Cancer Detection',
      description: 'Identify potential bone tumors or cancerous lesions.',
      icon: <Skull className="h-10 w-10 text-rose-500" />,
    },
    {
      id: 'bone-infection',
      title: 'Bone Infection Detection',
      description: 'Detect signs of osteomyelitis or bone infections.',
      icon: <FlaskConical className="h-10 w-10 text-orange-500" />,
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
        variant="gradient"
        onClick={() => navigate('/tasks')}
        className="mb-6 hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <h1 className={`text-3xl font-bold mb-2 ${titleFadeIn ? 'fade-in-title visible' : 'fade-in-title'}`} style={{ color: 'black' }}>Select Analysis Type</h1>
      <p className="text-muted-foreground mb-8 animate-fade-in">
        Choose the type of bone health analysis you would like to perform
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {analysisOptions.map((option) => (
          <Card key={option.id} className="hover-card transition-all duration-300 hover:shadow-2xl transform hover:translate-z-0 hover:scale-103 rounded-xl border border-gray-100 bg-white/90 backdrop-blur-sm animate-fade-in">
            <CardHeader className="pb-2">
              <div className="mb-3 bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl inline-block">{option.icon}</div>
              <CardTitle className="font-semibold text-lg hover-title">{option.title}</CardTitle>
              <CardDescription className="text-muted-foreground text-sm mt-1">{option.description}</CardDescription>
            </CardHeader>
            <CardFooter className="pt-4">
              <Button
                className="w-full hover-scale transition-all duration-300 hover:shadow-lg active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
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
