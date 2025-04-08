import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, X, Upload, MapPin } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { toast } from 'sonner';
import FindDoctorDialog from '@/components/FindDoctorDialog';

const AnalysisPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [taskDetails, setTaskDetails] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [findDoctorOpen, setFindDoctorOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      // Mock task details based on taskId
      const mockTasks = {
        '1': {
          id: '1',
          title: 'Bone Fracture Detection',
          description: 'Upload an X-ray image to detect potential bone fractures.',
          specialistType: 'Orthopedic Surgeon',
          instructions: [
            'Ensure the X-ray image is clear and well-lit.',
            'Position the bone of interest in the center of the image.',
            'Avoid images with excessive artifacts or obstructions.'
          ]
        },
        '2': {
          id: '2',
          title: 'Osteoporosis Prediction',
          description: 'Upload a bone density scan to predict the likelihood of osteoporosis.',
          specialistType: 'Endocrinologist',
          instructions: [
            'Upload a recent bone density scan in DICOM format.',
            'Ensure the scan includes the lumbar spine and hip regions.',
            'Provide patient age and gender for accurate analysis.'
          ]
        },
        '3': {
          id: '3',
          title: 'Arthritis Detection',
          description: 'Upload an X-ray image to detect potential arthritis.',
          specialistType: 'Rheumatologist',
          instructions: [
            'Ensure the X-ray image is clear and well-lit.',
            'Position the joint of interest in the center of the image.',
            'Avoid images with excessive artifacts or obstructions.'
          ]
        },
        '4': {
          id: '4',
          title: 'Bone Tumor Detection',
          description: 'Upload an X-ray image to detect potential bone tumors.',
          specialistType: 'Orthopedic Oncologist',
          instructions: [
            'Ensure the X-ray image is clear and well-lit.',
            'Position the bone of interest in the center of the image.',
            'Avoid images with excessive artifacts or obstructions.'
          ]
        },
      };

      const task = mockTasks[taskId as keyof typeof mockTasks];
      if (task) {
        setTaskDetails(task);
      } else {
        toast.error('Task not found');
        navigate('/tasks');
      }
    };

    fetchTaskDetails();
  }, [taskId, navigate]);

  const handleUpload = async (file: File) => {
    setSelectedImage(file);
    setIsUploading(true);
    
    // Simulate upload process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsUploading(false);
    toast.success('Image uploaded successfully');
  };

  const handleAnalyze = () => {
    if (!selectedImage) {
      toast.error('Please upload an image first');
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate analysis process
    setTimeout(() => {
      setIsAnalyzing(false);
      toast.success('Analysis complete');
      navigate(`/result?type=${taskDetails?.title.split(' ')[0].toLowerCase()}&id=${taskId}`);
    }, 2000);
  };

  const handleDeleteImage = () => {
    setSelectedImage(null);
  };

  return (
    <div className="container page-transition max-w-6xl py-16 px-4 md:px-6">
      <header className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{taskDetails?.title || 'Analysis'}</h1>
              <p className="text-muted-foreground mt-1">{taskDetails?.description || 'Upload an image to analyze'}</p>
            </div>
          </div>
          
          <Button 
            onClick={() => setFindDoctorOpen(true)}
            variant="outline" 
            className="gap-2"
          >
            <MapPin size={16} className="text-indigo-500" />
            Find Specialist
          </Button>
        </div>
        
        {taskDetails?.instructions && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <h3 className="text-lg font-semibold mb-2">Task Instructions:</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {taskDetails.instructions.map((instruction: string, index: number) => (
                <li key={index}>{instruction}</li>
              ))}
            </ul>
          </div>
        )}
      </header>

      <div className="grid gap-6">
        {selectedImage ? (
          <div className="relative">
            <img 
              src={URL.createObjectURL(selectedImage)} 
              alt="Uploaded" 
              className="rounded-lg max-h-96 w-full object-contain" 
            />
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute top-2 right-2 shadow-md"
              onClick={handleDeleteImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <ImageUpload onUpload={handleUpload} isUploading={isUploading}>
            {isUploading ? (
              <Skeleton className="w-[350px] h-[200px]" />
            ) : (
              <div className="flex flex-col items-center justify-center h-48 w-full rounded-lg border-2 border-dashed border-muted-foreground/50 bg-muted/10">
                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload an image</p>
              </div>
            )}
          </ImageUpload>
        )}

        <Button 
          onClick={handleAnalyze} 
          disabled={!selectedImage || isAnalyzing}
          className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white"
        >
          {isAnalyzing ? (
            <>
              Analyzing...
              <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin ml-2"></span>
            </>
          ) : (
            'Analyze Image'
          )}
        </Button>
      </div>
      
      <FindDoctorDialog 
        open={findDoctorOpen} 
        onOpenChange={setFindDoctorOpen} 
        specialistType={taskDetails?.specialistType || "Orthopedic Specialist"}
        analysisType={taskDetails?.title || "Bone Health Analysis"}
      />
    </div>
  );
};

export default AnalysisPage;
