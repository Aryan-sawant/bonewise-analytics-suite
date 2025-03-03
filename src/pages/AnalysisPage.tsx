import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ImageUpload';
import { toast } from 'sonner';

const TASK_TITLES: Record<string, string> = {
  'fracture-detection': 'Bone Fracture Detection',
  'bone-marrow': 'Bone Marrow Cell Classification',
  'osteoarthritis': 'Knee Joint Osteoarthritis Detection',
  'osteoporosis': 'Osteoporosis Stage & BMD Score',
  'bone-age': 'Bone Age Detection',
  'spine-fracture': 'Cervical Spine Fracture Detection',
  'bone-tumor': 'Bone Tumor/Cancer Detection',
  'bone-infection': 'Bone Infection (Osteomyelitis) Detection'
};

const TASK_GUIDANCE: Record<string, string> = {
  'fracture-detection': 'Upload an X-ray image of the bone area. The image should clearly show the suspected fracture area.',
  'bone-marrow': 'Upload a microscope image of the bone marrow sample.',
  'osteoarthritis': 'Upload an X-ray or MRI image of the knee joint.',
  'osteoporosis': 'Upload a DEXA scan or X-ray image of the spine, hip, or wrist.',
  'bone-age': 'Upload an X-ray image of the hand and wrist.',
  'spine-fracture': 'Upload an X-ray, CT scan or MRI image of the cervical spine.',
  'bone-tumor': 'Upload an X-ray, MRI, or CT scan showing the suspected area.',
  'bone-infection': 'Upload an X-ray, MRI, or bone scan showing the affected area.'
};

const EXAMPLE_RESULTS: Record<string, {common: string, doctor: string}> = {
  'fracture-detection': {
    common: 'Based on the analysis of your X-ray, there appears to be a potential fracture in the displayed bone. This may require medical attention. Please consult with a healthcare professional for a proper diagnosis.',
    doctor: 'The image shows a non-displaced transverse fracture of the distal radius with approximately 1mm separation. No apparent articular involvement. Surrounding soft tissue edema is evident. Recommend immobilization and follow-up radiographs in 1-2 weeks to assess healing progress.'
  },
  'osteoporosis': {
    common: "Based on the analysis, there are signs suggesting moderate bone density loss consistent with osteopenia or early-stage osteoporosis. This may increase your risk of fractures. It's recommended to discuss these results with your doctor.",
    doctor: 'DEXA scan analysis indicates T-score of -2.3 at L1-L4 vertebrae, consistent with osteoporosis according to WHO criteria. Trabecular pattern shows significant thinning. Recommend calcium and vitamin D supplementation, consider bisphosphonate therapy, and fall prevention counseling.'
  },
  'default': {
    common: "Thank you for uploading your medical image. Based on our AI analysis, we've identified some findings that should be reviewed by a healthcare professional for a complete diagnosis.",
    doctor: 'The AI analysis has detected potential abnormalities that warrant further clinical correlation. Consider additional diagnostic procedures to confirm findings and establish appropriate treatment protocols.'
  }
};

const AnalysisPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);
  
  useEffect(() => {
    if (taskId && !TASK_TITLES[taskId]) {
      toast.error('Invalid analysis task');
      navigate('/tasks');
    }
  }, [taskId, navigate]);
  
  const handleImageUpload = (file: File) => {
    setImage(file);
    setImageUrl(URL.createObjectURL(file));
    setResults(null);
  };
  
  const handleAnalyze = async () => {
    if (!image) {
      toast.error('Please upload an image first');
      return;
    }
    
    setAnalyzing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const resultKey = taskId && EXAMPLE_RESULTS[taskId] ? taskId : 'default';
      const resultType = user?.userType === 'doctor' ? 'doctor' : 'common';
      setResults(EXAMPLE_RESULTS[resultKey][resultType]);
      
      toast.success('Analysis complete');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze image. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };
  
  if (!taskId || !user) return null;
  
  const taskTitle = TASK_TITLES[taskId] || 'Unknown Analysis';
  const taskGuidance = TASK_GUIDANCE[taskId] || 'Please upload an appropriate medical image for analysis.';
  
  return (
    <div className="container mx-auto px-4 py-12">
      <Button 
        variant="outline" 
        onClick={() => navigate('/tasks')}
        className="mb-6"
      >
        ← Back to Tasks
      </Button>
      
      <h1 className="text-3xl font-bold mb-2">{taskTitle}</h1>
      <p className="text-muted-foreground mb-8">
        {user.userType === 'doctor' ? 'AI-assisted analysis for clinical evaluation' : 'AI-powered analysis for informational purposes only'}
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border">
          <CardHeader>
            <CardTitle>Upload Medical Image</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{taskGuidance}</p>
            
            <ImageUpload
              onImageSelected={handleImageUpload}
              imageUrl={imageUrl}
            />
            
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={handleAnalyze}
                disabled={!image || analyzing}
                className="w-full md:w-auto"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Image'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="prose dark:prose-invert">
                <p className="whitespace-pre-wrap">{results}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6 border rounded-md border-dashed">
                <p className="text-muted-foreground">
                  {analyzing ? 'Processing your image...' : 'Upload an image and click "Analyze Image" to see results'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalysisPage;
