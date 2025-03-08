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

const task_prompts = {
    "fracture-detection": (
        "Analyze the X-ray, MRI, or CT scan image for fractures and classify into different fracture types with detailed severity assessment. \n" +
        "**For common users:** The image will be analyzed to check for fractures, identifying the affected bone and the type of break. \n" +
        "You will receive an easy-to-understand explanation of the fracture, including its severity and possible effects on movement, provide nutrition plan,steps to recover like remedies and exercises if required. \n" +
        "**For doctors:** Suggest medical treatment options, possible surgeries, immobilization techniques, and follow-up care strategies,provide nutrition plan,steps to recover like remedies and exercises if required."
    ),

    "bone-marrow": (
        "Analyze the biopsy or MRI image and classify bone marrow cells into relevant categories, identifying concerning cells. \n" +
        "**For common users:** The image will be analyzed to check for abnormalities in bone marrow cells. \n" +
        "You will receive a simple explanation of the findings, including whether there are unusual cell changes and what they might indicate,provide nutrition plan,steps to recover like remedies and exercises if required. \n" +
        "**For doctors:** Provide detailed insights into abnormal cell structures, possible diagnoses, and recommended medical interventions,provide nutrition plan,steps to recover like remedies and exercises if required."
    ),

    "osteoarthritis": (
        "Analyze the knee X-ray or MRI and classify osteoarthritis severity based on clinical grading. \n" +
        "**For common users:** The image will be assessed for signs of knee osteoarthritis, including joint space narrowing and bone changes. \n" +
        "You will get an easy-to-understand report on whether osteoarthritis is present and its severity level, along with its impact on knee function,provide nutrition plan,steps to recover like remedies and exercises if required. \n" +
        "**For doctors:** Suggest advanced treatments, medications, physiotherapy plans, and surgical options such as knee replacement,provide nutrition plan,steps to recover like remedies and exercises if required."

    ),

    "osteoporosis": (
        "Analyze the bone X-ray and determine osteoporosis stage with estimated Bone Mineral Density (BMD) score. \n" +
        "**For common users:** The scan will be analyzed to determine how strong or weak the bones are and whether osteoporosis is present. \n" +
        "You will receive a simple explanation of the results, including whether bone density is lower than normal and what it means for bone health,provide nutrition plan,steps to recover like remedies and exercises if required. \n" +
        "**For doctors:** Recommend specific medications, hormone therapy, and advanced treatments to manage and prevent complications,provide nutrition plan,steps to recover like remedies and exercises if required."
    ),

    "bone-age": (
        "Analyze the X-ray of a child's hand and predict bone age with insights into growth patterns. \n" +
        "**For common users:** The scan will be assessed to check how well the bones are developing compared to the expected growth pattern for the child’s age. \n" +
        "You will receive an easy-to-understand result explaining whether the bone growth is normal, advanced, or delayed,provide nutrition plan,steps to recover like remedies and exercises if required. \n" +
        "**For doctors:** Offer insights into growth abnormalities, hormonal imbalances, and necessary medical interventions if delayed growth is detected,provide nutrition plan,steps to recover like remedies and exercises if required."
    ),

    "spine-fracture": (
        "Analyze the X-ray, MRI, or CT scan of the cervical spine for fractures and provide a severity assessment. \n" +
        "**For common users:** The scan will be analyzed for fractures in the neck bones, and you will receive an explanation of the findings. \n" +
        "The report will describe whether a fracture is present, its severity, and how it may affect movement or pain levels,provide nutrition plan,steps to recover like remedies and exercises if required\n" +
        "**For doctors:** Suggest medical treatment plans, possible surgical options, and rehabilitation strategies for full recovery,provide nutrition plan,steps to recover like remedies and exercises if required"
    ),

    "bone-tumor": (
        "Analyze the X-ray, MRI, CT scan, or biopsy image for possible bone tumors or cancerous growths. \n" +
        "**For common users:** The image will be checked for any unusual growths or masses in the bone, and you will receive a simple explanation of the findings. \n" +
        "If any suspicious areas are detected, the report will describe their size, location, and whether they appear concerning,provide nutrition plan,steps to recover like remedies and exercises if required.\n" +
        "**For doctors:** Provide detailed insights into tumor classification, possible malignancy assessment, and treatment options,provide nutrition plan,steps to recover like remedies and exercises if required. "
    ),

    "bone-infection": (
        "Analyze the X-ray, MRI, CT scan, or biopsy image for signs of bone infection (osteomyelitis). \n" +
        "**For common users:** The image will be checked for any signs of infection in the bone, such as swelling, bone damage, or abscess formation. \n" +
        "You will receive an easy-to-understand explanation of whether an infection is present and how it may be affecting the bone,provide nutrition plan,steps to recover like remedies and exercises if required.\n" +
        "**For doctors:** Provide insights on infection severity, possible antibiotic treatments, and surgical recommendations if needed,provide nutrition plan,steps to recover like remedies and exercises if required."
    )
}

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

    // More robust removal of bold markers for download
    let textForDownload = results
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/\*\*([^*]+)\*/g, '$1') // Aggressive cleanup for stray asterisks
        .replace(/__([^_]+)_/g, '$1');  // Aggressive cleanup for stray underscores

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

  const formatResults = (resultsText: string) => {
    if (!resultsText) return null;

    // Remove code blocks
    const textWithoutCodeBlocks = resultsText.replace(/```[\s\S]*?```/g, '');

    const paragraphs = textWithoutCodeBlocks.split(/\n\n+/);
    return (
      <div className="space-y-4 leading-relaxed">
        {paragraphs.map((para, index) => {
          // console.log("Raw Paragraph:", para); // Debugging Log - Raw Paragraph

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

          // Simplified Bold Regex for debugging - using only standard **bold**
          const formattedPara = para.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
          // console.log("Formatted Paragraph:", formattedPara); // Debugging Log - Formatted Paragraph
          return <p key={index} className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: formattedPara }} />;
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
          className="transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 bg-primary-foreground text-primary" // Blue Background, White Text
        >
          ← Back to Tasks
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 bg-primary-foreground text-primary" // Blue Background, White Text
        >
          <Home className="mr-2 h-4 w-4" />
          Home
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-2 animate-slide-in text-primary-foreground">{taskTitle}</h1>
      <p className="text-muted-foreground mb-8 animate-fade-in">
        {user.userType === 'doctor' ? 'AI-assisted analysis for clinical evaluation' : 'AI-powered analysis for informational purposes only'}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border transition-all duration-300 hover:shadow-lg animate-fade-in bg-card dark:bg-card-dark">
          <CardHeader className="bg-primary-foreground text-primary"> {/* Blue Card Header */}
            <CardTitle className="text-lg font-semibold text-card-foreground dark:text-card-foreground-dark">Upload Medical Image</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{taskGuidance}</p>
            <ImageUpload
              onImageSelected={handleImageUpload}
              imageUrl={imageUrl}
              isLoading={analyzing}
            />

            <div className="mt-4 flex justify-between">
              {imageUrl && (
                <Button
                  variant="secondary"
                  onClick={openImageModal}
                  className="mr-2 transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Image
                </Button>
              )}
              <Button
                onClick={handleAnalyze}
                disabled={!image || analyzing}
                className="w-full md:w-auto transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 text-primary-foreground bg-primary" // White Analyze Button, Blue Background
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

        <Card className={`border transition-all duration-300 hover:shadow-lg animate-fade-in ${isResultsMaximized ? 'lg:col-span-2 fixed top-0 left-0 w-full h-full z-50 bg-white dark:bg-gray-950 rounded-none' : 'bg-card dark:bg-card-dark'}`}>
          <CardHeader className="flex flex-row items-center justify-between bg-primary-foreground text-primary"> {/* Blue Card Header */}
            <CardTitle className="text-lg font-semibold text-card-foreground dark:text-card-foreground-dark">Analysis Results</CardTitle>
            <div className="flex items-center space-x-2">
              {results && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadResults}
                  className="flex items-center gap-1 transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105"
                >
                  <Download size={14} />
                  Download
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsResultsMaximized(!isResultsMaximized)}
                className="transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105"
              >
                {isResultsMaximized ? <Minimize size={16} /> : <Maximize size={16} />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className={`${isResultsMaximized ? 'h-[calc(100vh-8rem)] overflow-y-auto' : ''} bg-card-content dark:bg-card-content-dark rounded-md p-6`}>
            {results ? (
              <div className="prose dark:prose-invert max-w-none animate-fade-in text-typography-primary font-serif">
                {formatResults(results)}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6 border rounded-md border-dashed border-destructive/50 animate-fade-in bg-background dark:bg-background-dark">
                <p className="text-destructive">
                  {error}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6 border rounded-md border-dashed animate-pulse bg-background dark:bg-background-dark">
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

      {results && (
        <ChatbotButton
          analysisContext={results}
          taskTitle={taskTitle}
          analysisId={analysisId}
        />
      )}

      {/* Image Modal */}
      {isImageModalOpen && imageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative bg-card dark:bg-card-dark rounded-lg p-6 max-w-3xl max-h-full overflow-auto">
            <Button
              variant="ghost"
              onClick={closeImageModal}
              className="absolute top-2 right-2 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105"
            >
              <Minimize size={16} />
            </Button>
            <h3 className="text-lg font-semibold mb-4 text-card-foreground dark:text-card-foreground-dark">Uploaded Image</h3>
            <img src={imageUrl} alt="Uploaded Image" className="rounded-md max-w-full max-h-[70vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;
