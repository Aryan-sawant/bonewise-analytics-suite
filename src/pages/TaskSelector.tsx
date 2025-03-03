
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
    <div className="container mx-auto px-4 py-12">
      <Button 
        variant="outline" 
        onClick={() => navigate('/tasks')}
        className="mb-6"
      >
        ← Back to Tasks
      </Button>
      
      <h1 className="text-3xl font-bold mb-2">Select Analysis Type</h1>
      <p className="text-muted-foreground mb-8">
        Choose the type of bone health analysis you would like to perform
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {analysisOptions.map((option) => (
          <Card key={option.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="mb-4">{option.icon}</div>
              <CardTitle>{option.title}</CardTitle>
              <CardDescription>{option.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button 
                className="w-full"
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
