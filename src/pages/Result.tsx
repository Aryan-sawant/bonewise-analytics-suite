import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Download, Share2, UserRound } from 'lucide-react';
import ResultsDisplay from '@/components/ResultsDisplay';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState<any>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareNote, setShareNote] = useState('');
  
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const searchParams = new URLSearchParams(location.search);
  const analysisType = searchParams.get('type') || '';
  const imageId = searchParams.get('id') || '';
  
  useEffect(() => {
    const simulateLoading = setTimeout(() => {
      setLoading(false);
      
      let mockResults;
      
      if (analysisType === 'fracture') {
        mockResults = {
          analysisType: 'Bone Fracture Detection',
          imageUrl: 'https://images.unsplash.com/photo-1564725065182-9f984f75b27f?q=80&w=1000',
          timestamp: new Date().toLocaleString(),
          results: [
            {
              title: 'Fracture Detection',
              content: 'The AI analysis detected a transverse fracture in the radius bone. The fracture line is clearly visible and appears to be a complete fracture, extending through the entire width of the bone.'
            },
            {
              title: 'Fracture Classification',
              content: 'Based on the image analysis, this appears to be a simple, closed fracture without displacement. There is no evidence of bone fragments or significant misalignment of the bone ends.'
            },
            {
              title: 'Recommendation',
              content: 'This type of fracture typically requires immobilization with a cast or brace. Follow up with an orthopedic specialist is recommended for proper treatment planning.'
            }
          ]
        };
      } else if (analysisType === 'osteoporosis') {
        mockResults = {
          analysisType: 'Osteoporosis Prediction',
          imageUrl: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?q=80&w=1000',
          timestamp: new Date().toLocaleString(),
          results: [
            {
              title: 'Bone Mineral Density (BMD) Assessment',
              content: 'The AI analysis estimates a BMD T-score of approximately -2.3, which falls within the range of osteoporosis according to World Health Organization criteria (T-score of -2.5 or below).'
            },
            {
              title: 'Bone Quality Analysis',
              content: 'The image shows signs of reduced bone mass and deterioration of bone tissue. The trabecular pattern appears less dense than normal, which is consistent with osteoporosis.'
            },
            {
              title: 'Fracture Risk Assessment',
              content: 'Based on the BMD estimation and bone structure analysis, there appears to be an elevated risk of fragility fractures. Consider discussing preventive measures with your healthcare provider.'
            }
          ]
        };
      } else {
        mockResults = {
          analysisType: 'Bone Health Analysis',
          imageUrl: 'https://images.unsplash.com/photo-1581595219315-a187dd40c322?q=80&w=1000',
          timestamp: new Date().toLocaleString(),
          results: [
            {
              title: 'Analysis Results',
              content: 'The AI analysis has been completed. Detailed results will be available for this analysis type in a future update.'
            }
          ]
        };
      }
      
      setResultData(mockResults);
    }, 2000);
    
    return () => clearTimeout(simulateLoading);
  }, [analysisType, imageId]);
  
  const handleConsultSpecialist = () => {
    let specialistType = "orthopedic doctor"; // Default specialist
    
    // Determine specialist type based on analysis type
    if (analysisType === 'fracture') {
      specialistType = "orthopedic doctor";
    } else if (analysisType === 'osteoporosis') {
      specialistType = "endocrinologist";
    } else if (analysisType === 'bone-tumor') {
      specialistType = "oncologist";
    } else if (analysisType === 'spine-fracture') {
      specialistType = "spine surgeon";
    }
    
    // Use the user's current location to search for specialists in Google Maps
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        // Create Google Maps URL with search query for the specialist type near me
        const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(specialistType)}+near+me/@${latitude},${longitude},14z`;
        // Open in a new tab
        window.open(mapsUrl, '_blank');
      }, () => {
        // If geolocation fails, open with just the search term
        const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(specialistType)}+near+me`;
        window.open(mapsUrl, '_blank');
      });
    } else {
      // Fallback if geolocation is not supported
      const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(specialistType)}+near+me`;
      window.open(mapsUrl, '_blank');
    }
  };
  
  return (
    <div className="container page-transition max-w-6xl py-16 px-4 md:px-6">
      <header className="mb-12">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Button 
                variant="gradient" 
                size="icon" 
                onClick={() => navigate('/analysis')}
                className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-xl"
              >
                <ArrowLeft size={16} />
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">Analysis Results</h1>
            </div>
            <p className="text-muted-foreground">
              {loading ? 'Processing your image...' : resultData?.analysisType} results
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant="gradient" 
              className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl"
              onClick={() => resultsRef.current?.querySelector('.download-btn')?.dispatchEvent(new MouseEvent('click'))}
              disabled={loading || !resultData}
            >
              <Download size={16} />
              Download PDF
            </Button>
            <Button 
              variant="gradient" 
              className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl"
              onClick={() => setShareDialogOpen(true)}
              disabled={loading || !resultData}
            >
              <Share2 size={16} />
              Share
            </Button>
            {user && user.userType !== 'doctor' && resultData && (
              <Button 
                variant="gradient" 
                className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl"
                onClick={handleConsultSpecialist}
              >
                <UserRound size={16} />
                Consult a Specialist
              </Button>
            )}
            <Button 
              variant="gradient" 
              className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl" 
              onClick={() => navigate('/dashboard')}
            >
              <Home size={16} />
              Dashboard
            </Button>
          </div>
        </div>
      </header>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="loader mb-6"></span>
          <p className="text-lg text-muted-foreground animate-pulse">Analyzing your image with AI...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
        </div>
      ) : (
        resultData && (
          <div ref={resultsRef}>
            <ResultsDisplay
              imageUrl={resultData.imageUrl}
              analysisType={resultData.analysisType}
              results={resultData.results}
              timestamp={resultData.timestamp}
            />
          </div>
        )
      )}
      
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Analysis Results</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="share-email">Email address</Label>
              <Input
                id="share-email"
                type="email"
                placeholder="recipient@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-note">Add a note (optional)</Label>
              <Input
                id="share-note"
                placeholder="Optional message to accompany the analysis"
                value={shareNote}
                onChange={(e) => setShareNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShareDialogOpen(false)}
              className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => resultsRef.current?.querySelector('.share-btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))} 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl"
            >
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Result;
