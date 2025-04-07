
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Home, Download, Maximize, Minimize, Eye, ZoomIn, ZoomOut, ArrowLeft } from 'lucide-react';
import ChatbotButton from '@/components/ChatbotButton';
import { motion } from 'framer-motion';
import { AuroraBackground } from '@/components/ui/aurora-background';

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
  const [isResultsMaximized, setIsResultsMaximized] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isImageModalMaximized, setIsImageModalMaximized] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

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
    setIsImageModalMaximized(false);
    setZoomLevel(1);

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
    setIsImageModalMaximized(false);
    setZoomLevel(1);
  };

  const toggleImageModalMaximize = () => {
    setIsImageModalMaximized(!isImageModalMaximized);
  };

  const handleZoomIn = () => {
    setZoomLevel((prevZoom) => Math.min(prevZoom + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prevZoom) => Math.max(prevZoom - 0.25, 0.5));
  };


  if (!taskId || !user) return null;

  const taskTitle = TASK_TITLES[taskId] || 'Unknown Analysis';
  const taskGuidance = TASK_GUIDANCE[taskId] || 'Please upload an appropriate medical image for analysis.';

  const formatResults = (resultsText: string) => {
    if (!resultsText) return null;

    // Remove code blocks
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

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 } 
    }
  };

  return (
    <AuroraBackground showRadialGradient={false}>
      <div className="container mx-auto px-4 py-12 animate-fade-in">
        <motion.div 
          className="flex justify-between items-center mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="outline"
            onClick={() => navigate('/bone-analysis')}
            className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 bg-primary-foreground text-blue-500 border-blue-500 hover:bg-blue-500/10 rounded-lg"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 bg-primary-foreground text-blue-500 border-blue-500 hover:bg-blue-500/10 rounded-lg"
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            {TASK_TITLES[taskId] || 'Analysis'}
          </h1>
          <p className="text-muted-foreground mb-8 animate-fade-in">
            {user.userType === 'doctor' ? 
              'AI-assisted analysis for clinical evaluation' : 
              'AI-powered analysis for informational purposes only'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div variants={fadeIn} initial="hidden" animate="visible">
            <Card className="border transition-all duration-300 hover:shadow-lg animate-fade-in bg-card dark:bg-card-dark rounded-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary to-blue-600 text-primary-foreground rounded-t-lg">
                <CardTitle className="text-lg font-semibold text-primary-foreground">Upload Medical Image</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-6">{taskGuidance}</p>
                <ImageUpload
                  onImageSelected={handleImageUpload}
                  imageUrl={imageUrl}
                  isLoading={analyzing}
                />

                <div className="mt-6 flex justify-between">
                  {imageUrl && (
                    <Button
                      variant="secondary"
                      onClick={openImageModal}
                      className="mr-2 transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-lg"
                    >
                      <Eye className="mr-2 h-4 w-4" style={{ color: 'black' }} />
                      View Image
                    </Button>
                  )}
                  <Button
                    onClick={handleAnalyze}
                    disabled={!image || analyzing}
                    className="w-full md:w-auto transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 text-primary-foreground bg-gradient-to-r from-primary to-blue-600 rounded-lg border-0"
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
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
            <Card className={`border transition-all duration-300 hover:shadow-lg animate-fade-in ${isResultsMaximized ? 'lg:col-span-2 fixed top-0 left-0 w-full h-full z-50 bg-white dark:bg-gray-950 rounded-none' : 'bg-card dark:bg-card-dark rounded-lg overflow-hidden'}`}>
              <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600 text-primary-foreground rounded-t-lg">
                <CardTitle className="text-lg font-semibold text-primary-foreground">Analysis Results</CardTitle>
                <div className="flex items-center space-x-2">
                  {results && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadResults}
                      className="flex items-center gap-1 transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-lg bg-white/20 text-white border-white/30 hover:bg-white/30"
                    >
                      <Download size={14} />
                      Download
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsResultsMaximized(!isResultsMaximized)}
                    className="transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-lg text-white hover:bg-white/20"
                  >
                    {isResultsMaximized ? <Minimize size={16} /> : <Maximize size={16} />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className={`${isResultsMaximized ? 'h-[calc(100vh-8rem)] overflow-y-auto' : ''} bg-card-content dark:bg-card-content-dark rounded-b-lg p-6`}>
                {/* Results content */}
                {results ? (
                  <div className="prose dark:prose-invert max-w-none animate-fade-in text-typography-primary font-serif" style={{ color: 'black' }}>
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
                        <>Processing your image with AI...</>
                      ) : 'Upload an image and click "Analyze Image" to see results'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <ChatbotButton
              analysisContext={results}
              taskTitle={taskTitle}
              analysisId={analysisId}
              className="rounded-lg mt-8"
            />
          </motion.div>
        )}

        {/* Image Modal */}
        {isImageModalOpen && imageUrl && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 transition-all duration-300 ${isImageModalMaximized ? 'fixed top-0 left-0 w-full h-full' : ''}`}>
            <motion.div 
              className={`relative bg-card dark:bg-card-dark rounded-lg overflow-hidden max-w-3xl max-h-full ${isImageModalMaximized ? 'w-full h-full rounded-none' : ''}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600 text-primary-foreground rounded-t-lg mb-4">
                <CardTitle className="text-lg font-semibold text-primary-foreground">Uploaded Image</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    onClick={handleZoomIn}
                    className="transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-lg text-white hover:bg-white/20"
                  >
                    <ZoomIn size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleZoomOut}
                    className="transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-lg text-white hover:bg-white/20"
                  >
                    <ZoomOut size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={toggleImageModalMaximize}
                    className="transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-lg text-white hover:bg-white/20"
                  >
                    {isImageModalMaximized ? <Minimize size={16} /> : <Maximize size={16} />}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={closeImageModal}
                    className="hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-lg text-white hover:bg-white/20"
                  >
                    <Minimize size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ overflow: 'auto', maxHeight: '70vh' }}> 
                  <img
                    src={imageUrl}
                    alt="Uploaded Image"
                    className="rounded-md max-w-full object-contain transition-all duration-300"
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
                  />
                </div>
              </CardContent>
            </motion.div>
          </div>
        )}
      </div>
    </AuroraBackground>
  );
};

export default AnalysisPage;
