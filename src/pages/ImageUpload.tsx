import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileType } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from "@/components/ui/separator";
import ImageUpload from '@/components/ImageUpload';
import { useAuthContext } from '@/contexts/AuthContext';

// Utility function to get the title and description based on analysis type
const getAnalysisTypeInfo = (type: string) => {
  const analysisTypes: Record<string, { title: string; description: string }> = {
    fracture: {
      title: 'Bone Fracture Detection',
      description: 'Upload an X-ray image to detect and analyze potential bone fractures'
    },
    osteoporosis: {
      title: 'Osteoporosis Prediction',
      description: 'Upload a bone density scan to predict osteoporosis stage and BMD score'
    },
    knee: {
      title: 'Knee Joint Osteoarthritis',
      description: 'Upload a knee MRI to detect and analyze knee joint osteoarthritis'
    },
    marrow: {
      title: 'Bone Marrow Classification',
      description: 'Upload microscopic images to classify bone marrow cells'
    },
    age: {
      title: 'Bone Age Detection',
      description: 'Upload a hand X-ray to determine bone age'
    },
    spine: {
      title: 'Cervical Spine Fracture',
      description: 'Upload a CT scan to detect cervical spine fractures'
    },
    tumor: {
      title: 'Bone Tumor Detection',
      description: 'Upload images to detect potential bone tumors'
    },
    infection: {
      title: 'Osteomyelitis Detection',
      description: 'Upload images to detect bone infections'
    }
  };
  
  return analysisTypes[type] || {
    title: 'Bone Health Analysis',
    description: 'Upload a medical image for AI-powered bone health analysis'
  };
};

const ImageUploadPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  
  // Parse query params
  const searchParams = new URLSearchParams(location.search);
  const analysisType = searchParams.get('type') || '';
  
  // Get info for the selected analysis type
  const { title, description } = getAnalysisTypeInfo(analysisType);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Reset progress when analysis type changes
  useEffect(() => {
    setSelectedFile(null);
    setIsUploading(false);
    setUploadProgress(0);
  }, [analysisType]);
  
  const handleImageUpload = (file: File) => {
    setSelectedFile(file);
  };
  
  const handleAnalyze = () => {
    if (!selectedFile) {
      toast.error('Please upload an image first');
      return;
    }
    
    setIsUploading(true);
    
    // Simulate upload progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(progressInterval);
        
        // Simulate processing delay
        setTimeout(() => {
          setIsUploading(false);
          
          // Navigate to results page
          navigate(`/result?type=${analysisType}&id=12345`);
        }, 1000);
      }
    }, 300);
  };
  
  return (
    <div className="container page-transition max-w-6xl py-16 px-4 md:px-6">
      <header className="mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/analysis')}>
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        </div>
        <p className="text-muted-foreground mt-2">{description}</p>
      </header>
      
      <Separator className="my-6" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left side - upload guidelines */}
        <div className="md:col-span-1 space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Upload Guidelines</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Use high-quality images for best results</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Ensure the bone or joint of interest is clearly visible</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Remove any personal identifying information from the image</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>JPG, PNG formats supported (max 5MB)</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Sample Images</h3>
            <div className="space-y-3">
              <div className="rounded-md overflow-hidden border">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <FileType size={24} className="text-muted-foreground" />
                </div>
                <div className="p-2 text-xs">
                  <span className="text-muted-foreground">Sample image will be shown here</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - image upload */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Upload Medical Image</h3>
            <ImageUpload 
              onImageSelected={handleImageUpload}
              isLoading={isUploading}
              buttonText="Select Medical Image"
              description={`Upload your ${analysisType === 'fracture' ? 'X-ray image' : 'medical image'} for analysis`}
            />
          </div>
          
          {selectedFile && (
            <div className="flex justify-end">
              <Button 
                onClick={handleAnalyze} 
                disabled={isUploading}
                className="w-full md:w-auto"
              >
                {isUploading ? `Uploading (${uploadProgress}%)` : 'Analyze Image'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploadPage;
