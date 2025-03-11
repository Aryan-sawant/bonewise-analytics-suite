import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Home, Download, Maximize, Minimize, Eye } from 'lucide-react';
import ChatbotButton from '@/components/ChatbotButton';

const TASK_TITLES: Record<string, string> = { // Keeping TASK_TITLES for UI
  'fracture-detection': 'Bone Fracture Detection',
  'bone-marrow': 'Bone Marrow Cell Classification',
  'osteoarthritis': 'Knee Joint Osteoarthritis Detection',
  'osteoporosis': 'Osteoporosis Stage & BMD Score',
  'bone-age': 'Bone Age Detection',
  'spine-fracture': 'Cervical Spine Fracture Detection',
  'bone-tumor': 'Bone Tumor/Cancer Detection',
  'bone-infection': 'Bone Infection (Osteomyelitis) Detection'
};

const TASK_GUIDANCE: Record<string, string> = { // Keeping TASK_GUIDANCE for UI
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
  const [isResultsMaximized, setIsResultsMaximized] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

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
    setIsImageModalOpen(false);

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

      const { data, error } = await supabase.functions.invoke('analyze-bone-image', {
        body: {
          image: imageBase64,
          taskId,
          userType: user.userType === 'doctor' ? 'doctor' : 'common',
          userId: user.id
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

    // Even MORE aggressive removal of bold markers for download - remove absolutely all asterisks and underscores
    let textForDownload = results
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/\*\*([^*]+)\*/g, '$1')
        .replace(/__([^_]+)_/g, '$1')
        .replace(/\*/g, '') // Remove absolutely all asterisks
        .replace(/_/g, '');  // Remove absolutely all underscores


    const taskTitle = TASK_TITLES[taskId || ''] || 'Bone Analysis';
    const fileName = `${taskTitle.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.txt`;

    const blob = new Blob([textForDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openImageModal = () => {
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };


  if (!taskId || !user) return null;

  const taskTitle = TASK_TITLES[taskId] || 'Unknown Analysis';
  const taskGuidance = TASK_GUIDANCE[taskId] || 'Please upload an appropriate medical image for analysis.';

  const formatResults = (resultsText: string) => { // Simplified formatResults (Option 1)
    if (!resultsText) return null;

    // Remove code blocks (keep if needed)
    const textWithoutCodeBlocks = resultsText.replace(/```[\s\S]*?```/g, '');

    const paragraphs = textWithoutCodeBlocks.split(/\n\n+/);
    return (
      <div className="space-y-4 leading-relaxed" style={{ color: 'black' }}>
        {paragraphs.map((para, index) => {
          if (para.match(/^#+\s/) || para.match(/^(Summary|Findings|Interpretation|Recommendations|Assessment|Diagnosis|Conclusion):/i)) {
            const headingText = para.replace(/^#+\s/, '').replace(/^(Summary|Findings|Interpretation|Recommendations|Assessment|Diagnosis|Conclusion):/i, '$1');
            return <h3 key={index} className="text-xl font-bold mt-6 first:mt-0 text-primary/90 border-b pb-1">{headingText}</h3>;
          }

          if (para.includes('• ') || para.includes('- ') || para.includes('* ')) {
            const listItems = para.split(/[•\-*]\s+/).filter(Boolean);
            return (
              <ul key={index} className="list-disc pl-5 space-y-2">
                {listItems.map((item, i) => (
                  <li key={i} className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: item.trim() }} />
                ))}
              </ul>
            );
          }

          // Simplified bold handling - just use dangerouslySetInnerHTML for backend-formatted HTML
          return <p key={index} className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: para }} />;
        })}
      </div>
    );
  };


  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      {/* ... rest of your AnalysisPage JSX, using TASK_TITLES and TASK_GUIDANCE if you kept them ... */}
            {results ? (
              <div className="prose dark:prose-invert max-w-none animate-fade-in text-typography-primary font-serif" style={{ color: 'black' }}>
                {formatResults(results)}
              </div>
            ) : error ? (
              // ... error state ...
            ) : (
              // ... loading/upload prompt state ...
            )}
      {/* ... rest of your AnalysisPage JSX ... */}
    </div>
  );
};

export default AnalysisPage;
