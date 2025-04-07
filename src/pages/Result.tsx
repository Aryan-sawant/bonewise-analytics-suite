
import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Download, Share2 } from 'lucide-react';
import ResultsDisplay from '@/components/ResultsDisplay';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  
  // Reference for PDF export
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Parse query params
  const searchParams = new URLSearchParams(location.search);
  const analysisType = searchParams.get('type') || '';
  const imageId = searchParams.get('id') || '';
  
  useEffect(() => {
    // In a real app, this would fetch the results from the backend
    // For now, just simulating the data
    
    const simulateLoading = setTimeout(() => {
      setLoading(false);
      
      // Create mock result data based on the analysis type
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
        // Default case for other analysis types
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
  
  const handleDownload = async () => {
    if (!resultData || !resultsRef.current) return;
    
    try {
      toast.info('Generating PDF report...');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add title
      pdf.setFontSize(18);
      pdf.text(resultData.analysisType, 20, 20);
      
      // Add date
      pdf.setFontSize(12);
      pdf.text(`Analysis Date: ${resultData.timestamp}`, 20, 30);
      
      // Add image to the report
      if (resultData.imageUrl) {
        pdf.addPage();
        pdf.text('Analyzed Image', 20, 20);
        
        // Create a temporary img element to get the image dimensions
        const img = new Image();
        img.src = resultData.imageUrl;
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
        });
        
        // Calculate image dimensions to fit on page
        const imgWidth = 170;
        const imgHeight = (img.height * imgWidth) / img.width;
        
        pdf.addImage(resultData.imageUrl, 'JPEG', 20, 30, imgWidth, imgHeight);
      }
      
      // Generate canvas from the results container
      const canvas = await html2canvas(resultsRef.current, { 
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Add results to PDF
      pdf.addPage();
      pdf.text('Analysis Results', 20, 20);
      
      const imgWidth = 170;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);
      
      // Save the PDF
      pdf.save(`${resultData.analysisType.replace(/\s+/g, '_')}_Report.pdf`);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };
  
  const handleShare = () => {
    if (!shareEmail) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // In a real application, this would send an email with the analysis results
    toast.success(`Analysis results shared with ${shareEmail}`);
    setShareDialogOpen(false);
    setShareEmail('');
    setShareNote('');
  };
  
  return (
    <div className="container page-transition max-w-6xl py-16 px-4 md:px-6">
      <header className="mb-12">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Button variant="outline" size="icon" onClick={() => navigate('/analysis')}>
                <ArrowLeft size={16} />
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">Analysis Results</h1>
            </div>
            <p className="text-muted-foreground">
              {loading ? 'Processing your image...' : resultData?.analysisType} results
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleDownload}
              disabled={loading || !resultData}
            >
              <Download size={16} />
              Download PDF
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setShareDialogOpen(true)}
              disabled={loading || !resultData}
            >
              <Share2 size={16} />
              Share
            </Button>
            <Button 
              variant="outline" 
              className="gap-2" 
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
      
      {/* Share Dialog */}
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
            >
              Cancel
            </Button>
            <Button onClick={handleShare} className="bg-gradient-to-r from-blue-500 to-indigo-600">
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Result;
