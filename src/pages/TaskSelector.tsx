
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bone, 
  ScanLine, 
  Activity, 
  Brain, 
  Clock, 
  Spine, 
  PlusCircle, 
  AlertCircle 
} from 'lucide-react';

const ANALYSIS_TASKS = [
  {
    id: 'fracture-detection',
    title: 'Bone Fracture Detection',
    description: 'Upload an X-ray to detect potential bone fractures',
    icon: <Bone className="h-12 w-12 text-medical-600" />,
    color: 'bg-medical-50',
  },
  {
    id: 'bone-marrow',
    title: 'Bone Marrow Cell Classification',
    description: 'Analyze bone marrow cell images for classification',
    icon: <ScanLine className="h-12 w-12 text-amber-600" />,
    color: 'bg-amber-50',
  },
  {
    id: 'osteoarthritis',
    title: 'Knee Joint Osteoarthritis',
    description: 'Detect osteoarthritis in knee joint images',
    icon: <Activity className="h-12 w-12 text-blue-600" />,
    color: 'bg-blue-50',
  },
  {
    id: 'osteoporosis',
    title: 'Osteoporosis Stage & BMD Score',
    description: 'Predict osteoporosis stage and analyze bone mineral density',
    icon: <AlertCircle className="h-12 w-12 text-purple-600" />,
    color: 'bg-purple-50',
  },
  {
    id: 'bone-age',
    title: 'Bone Age Detection',
    description: 'Determine bone age from X-ray images',
    icon: <Clock className="h-12 w-12 text-green-600" />,
    color: 'bg-green-50',
  },
  {
    id: 'spine-fracture',
    title: 'Cervical Spine Fracture Detection',
    description: 'Detect cervical spine fractures from medical images',
    icon: <Spine className="h-12 w-12 text-red-600" />,
    color: 'bg-red-50',
  },
  {
    id: 'bone-tumor',
    title: 'Bone Tumor/Cancer Detection',
    description: 'Analyze images for potential bone tumors or cancer',
    icon: <PlusCircle className="h-12 w-12 text-orange-600" />,
    color: 'bg-orange-50',
  },
  {
    id: 'bone-infection',
    title: 'Bone Infection (Osteomyelitis)',
    description: 'Detect signs of bone infection in medical images',
    icon: <Brain className="h-12 w-12 text-teal-600" />,
    color: 'bg-teal-50',
  }
];

const TaskSelector = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  
  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSelectTask = (taskId: string) => {
    navigate(`/analysis/${taskId}`);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Bone Health Analysis</h1>
      <p className="text-muted-foreground mb-8">
        Select a task to analyze your medical images using AI-powered bone health assessment
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {ANALYSIS_TASKS.map(task => (
          <Card 
            key={task.id}
            className={`border hover:shadow-md transition-all cursor-pointer overflow-hidden h-full`}
            onClick={() => handleSelectTask(task.id)}
          >
            <div className={`${task.color} px-6 py-4 flex justify-center`}>
              {task.icon}
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{task.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm">{task.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button size="sm" className="w-full">
                Start Analysis
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TaskSelector;
