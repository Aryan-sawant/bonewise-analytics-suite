import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Download, Share2, MapPin } from 'lucide-react';
import ResultsDisplay from '@/components/ResultsDisplay';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FindDoctorDialog from '@/components/FindDoctorDialog';
import ConsultDoctorSection from '@/components/ConsultDoctorSection';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState<any>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareNote, setShareNote] = useState('');
  const [findDoctorOpen, setFindDoctorOpen] = useState(false);
  
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const searchParams = new URLSearchParams(location.search);
  const analysisType = searchParams.get('type') || '';
  const imageId = searchParams.get('id') || '';
  const specialty = searchParams.get('specialty') || '';
  
  useEffect(() => {
    if (analysisType === 'consultation' && specialty) {
      setLoading(false);
      setFindDoctorOpen(true);
      return;
    }
    
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
          ],
          specialistType: 'Orthopedic Surgeon'
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
          ],
          specialistType: 'Endocrinologist'
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
          ],
          specialistType: 'Orthopedic Specialist'
        };
      }
      
      setResultData(mockResults);
    }, 2000);
    
    return () => clearTimeout(simulateLoading);
  }, [analysisType, imageId, specialty]);
  
  const handleDownload = async () => {
    if (!resultData || !resultsRef.current) return;
    
    try {
      toast.info('Generating PDF report...');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text(resultData.analysisType, 20, 20);
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Analysis Date: ${resultData.timestamp}`, 20, 30);
      
      pdf.setDrawColor(100, 100, 100);
      pdf.line(20, 35, 190, 35);
      
      const tempContainer = document.createElement('div');
      tempContainer.style.width = '700px';
      tempContainer.style.padding = '20px';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      tempContainer.style.color = '#000000';
      
      const resultsClone = resultsRef.current.cloneNode(true) as HTMLDivElement;
      
      const allTextElements = resultsClone.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span, div');
      allTextElements.forEach(el => {
        (el as HTMLElement).style.color = '#000000';
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.fontWeight = (el as HTMLElement).tagName.startsWith('H') ? 'bold' : 'normal';
      });
      
      tempContainer.appendChild(resultsClone);
      
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      document.body.appendChild(tempContainer);
      
      if (resultData.imageUrl) {
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Analyzed Image', 20, 20);
        
        const img = new Image();
        img.src = resultData.imageUrl;
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
        });
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        const maxImgWidth = pageWidth - 40;
        const maxImgHeight = pageHeight - 50;
        
        let imgWidth = img.width;
        let imgHeight = img.height;
        
        if (imgWidth > maxImgWidth) {
          const ratio = maxImgWidth / imgWidth;
          imgWidth = maxImgWidth;
          imgHeight = imgHeight * ratio;
        }
        
        if (imgHeight > maxImgHeight) {
          const ratio = maxImgHeight / imgHeight;
          imgHeight = maxImgHeight;
          imgWidth = imgWidth * ratio;
        }
        
        const xOffset = (pageWidth - imgWidth) / 2;
        
        pdf.addImage(resultData.imageUrl, 'JPEG', xOffset, 30, imgWidth, imgHeight);
      }
      
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Analysis Results', 20, 20);
      
      const canvas = await html2canvas(tempContainer, { 
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      document.body.removeChild(tempContainer);
      
      const imgData = canvas.toDataURL('image/png');
      
      const contentWidth = pdf.internal.pageSize.getWidth() - 40;
      const contentHeight = canvas.height * contentWidth / canvas.width;
      
      const contentPageCount = Math.ceil(contentHeight / pdf.internal.pageSize.getHeight());
      
      const imgPageHeight = canvas.height / contentPageCount;
      const pdfPageHeight = contentHeight / contentPageCount;
      
      for (let i = 0; i < contentPageCount; i++) {
        if (i > 0) pdf.addPage();
        
        const sy = imgPageHeight * i;
        const sHeight = Math.min(imgPageHeight, canvas.height - sy);
        
        const pdfImgHeight = Math.min(pdfPageHeight, contentHeight - (pdfPageHeight * i));
        
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = canvas.width;
        tmpCanvas.height = sHeight;
        const ctx = tmpCanvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(
            canvas, 
            0, sy, canvas.width, sHeight, 
            0, 0, tmpCanvas.width, tmpCanvas.height
          );
          
          const pageImgData = tmpCanvas.toDataURL('image/png');
          
          const yPosition = i === 0 ? 30 : 20;
          pdf.addImage(pageImgData, 'PNG', 20, yPosition, contentWidth, pdfImgHeight);
        }
      }
      
      const totalPageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Page ${i} of ${totalPageCount}`, pdf.internal.pageSize.getWidth() - 40, pdf.internal.pageSize.getHeight() - 10);
        pdf.text('AI-powered bone health analysis', 20, pdf.internal.pageSize.getHeight() - 10);
      }
      
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
    
    toast.success(`Analysis results shared with ${shareEmail}`);
    setShareDialogOpen(false);
    setShareEmail('');
    setShareNote('');
  };
  
  return (
    <div className="container page-transition max-w-6xl py-16 px-4 md:px-6">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
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
              variant="default" 
              className="gap-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"
              onClick={() => setFindDoctorOpen(true)}
            >
              <MapPin size={16} className="text-white" />
              <span className="text-white font-medium">Find Specialist</span>
            </Button>
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
      
      {analysisType === 'consultation' ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-32 w-32 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
            <MapPin size={48} className="text-indigo-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Find a Medical Specialist</h2>
          <p className="text-muted-foreground mb-6 max-w-lg">
            Connect with medical specialists who can provide professional care based on your bone health needs
          </p>
          <Button 
            className="gap-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"
            onClick={() => setFindDoctorOpen(true)}
            size="lg"
          >
            <MapPin size={18} className="text-white" />
            <span className="text-white font-medium">Find a Doctor Now</span>
          </Button>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="loader mb-6"></span>
          <p className="text-lg text-muted-foreground animate-pulse">Analyzing your image with AI...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
        </div>
      ) : (
        resultData && (
          <>
            <div ref={resultsRef}>
              <ResultsDisplay
                imageUrl={resultData.imageUrl}
                analysisType={resultData.analysisType}
                results={resultData.results}
                timestamp={resultData.timestamp}
              />
            </div>
            
            <ConsultDoctorSection 
              specialistType={resultData.specialistType} 
              analysisType={resultData.analysisType}
            />
          </>
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
            >
              Cancel
            </Button>
            <Button onClick={handleShare} className="bg-gradient-to-r from-blue-500 to-indigo-600">
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <FindDoctorDialog 
        open={findDoctorOpen} 
        onOpenChange={setFindDoctorOpen} 
        specialistType={resultData?.specialistType || specialty || 'Orthopedic Specialist'}
        analysisType={resultData?.analysisType || 'Bone Health Analysis'}
      />
    </div>
  );
};

export default Result;
