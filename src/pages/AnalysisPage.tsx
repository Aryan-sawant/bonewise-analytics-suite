
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Home, Download } from 'lucide-react';
import ChatbotButton from '@/components/ChatbotButton';

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

const AnalysisPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [storedImageUrl, setStoredImageUrl] = useState<string | null>(null);
  
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
    setError(null);
    setAnalysisId(null);
    setStoredImageUrl(null);

    // Convert the file to base64 for API transmission
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleAnalyze = async () => {
    if (!image || !imageBase64 || !taskId || !user) {
      toast.error('Please upload an image first');
      return;
    }
    
    setAnalyzing(true);
    setError(null);
    
    try {
      console.log("Sending image for analysis...");
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('analyze-bone-image', {
        body: {
          image: imageBase64,
          taskId,
          userType: user.userType === 'doctor' ? 'doctor' : 'common',
          userId: user.id // Pass the user ID for history recording
        }
      });

      if (error) {
        console.error('Function error:', error);
        throw new Error(`Analysis failed: ${error.message}`);
      }

      if (data?.error) {
        console.error('Data error:', data.error);
        throw new Error(data.error);
      }

      setResults(data.analysis);
      
      // Set analysis ID and image URL if available
      if (data.analysisId) {
        setAnalysisId(data.analysisId);
      }
      
      if (data.imageUrl) {
        setStoredImageUrl(data.imageUrl);
      }
      
      toast.success('Analysis complete');
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Failed to analyze image. Please try again or try a different image.');
      toast.error('Failed to analyze image. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };
  
  const handleDownloadResults = () => {
    if (!results) return;
    
    const taskTitle = TASK_TITLES[taskId || ''] || 'Bone Analysis';
    const fileName = `${taskTitle.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.txt`;
    
    const blob = new Blob([results], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (!taskId || !user) return null;
  
  const taskTitle = TASK_TITLES[taskId] || 'Unknown Analysis';
  const taskGuidance = TASK_GUIDANCE[taskId] || 'Please upload an appropriate medical image for analysis.';

  // Format the results for better visual display
  const formatResults = (resultsText: string) => {
    if (!resultsText) return null;
    
    // Split into paragraphs and format
    const paragraphs = resultsText.split(/\n\n+/);
    return (
      <div className="space-y-4 leading-relaxed">
        {paragraphs.map((para, index) => {
          // Check if this paragraph looks like a heading 
          if (para.match(/^#+\s/) || para.match(/^(Summary|Findings|Interpretation|Recommendations|Assessment|Diagnosis|Conclusion):/i)) {
            // Extract heading text without the marker
            const headingText = para.replace(/^#+\s/, '').replace(/^(Summary|Findings|Interpretation|Recommendations|Assessment|Diagnosis|Conclusion):/i, '$1');
            return <h3 key={index} className="text-xl font-bold mt-6 first:mt-0 text-primary/90 border-b pb-1">{headingText}</h3>;
          }
          
          // Check for bullet points
          if (para.includes('• ') || para.includes('- ') || para.includes('* ')) {
            const listItems = para.split(/[•\-*]\s+/).filter(Boolean);
            return (
              <ul key={index} className="list-disc pl-5 space-y-2">
                {listItems.map((item, i) => (
                  <li key={i} className="text-gray-800 dark:text-gray-200">{item.trim()}</li>
                ))}
              </ul>
            );
          }
          
          // Regular paragraph with better typography
          return <p key={index} className="text-gray-800 dark:text-gray-200">{para}</p>;
        })}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/tasks')}
          className="hover-scale"
        >
          ← Back to Tasks
        </Button>
        
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="hover-scale"
        >
          <Home className="mr-2 h-4 w-4" />
          Home
        </Button>
      </div>
      
      <h1 className="text-3xl font-bold mb-2 animate-slide-in">{taskTitle}</h1>
      <p className="text-muted-foreground mb-8 animate-fade-in">
        {user.userType === 'doctor' ? 'AI-assisted analysis for clinical evaluation' : 'AI-powered analysis for informational purposes only'}
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border transition-all duration-300 hover:shadow-md animate-fade-in">
          <CardHeader>
            <CardTitle>Upload Medical Image</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{taskGuidance}</p>
            
            <ImageUpload
              onImageSelected={handleImageUpload}
              imageUrl={imageUrl}
              isLoading={analyzing}
            />
            
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={handleAnalyze}
                disabled={!image || analyzing}
                className="w-full md:w-auto transition-all duration-300 hover:bg-primary/90"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : 'Analyze Image'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border transition-all duration-300 hover:shadow-md animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Analysis Results</CardTitle>
            {results && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadResults}
                className="flex items-center gap-1"
              >
                <Download size={14} />
                Download
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="prose dark:prose-invert max-w-none animate-fade-in text-typography-primary font-serif">
                {formatResults(results)}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6 border rounded-md border-dashed border-destructive/50 animate-fade-in">
                <p className="text-destructive">
                  {error}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6 border rounded-md border-dashed animate-pulse">
                <p className="text-muted-foreground">
                  {analyzing ? (
                    <>Processing your image with Gemini AI...</>
                  ) : 'Upload an image and click "Analyze Image" to see results'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Add chatbot button that uses the analysis context */}
      {results && (
        <ChatbotButton 
          analysisContext={results} 
          taskTitle={taskTitle} 
          analysisId={analysisId}
        />
      )}
    </div>
  );
};

export default AnalysisPage;
