
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { MessageCircle, Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ResultsDisplayProps {
  imageUrl: string;
  analysisType: string;
  results: {
    title: string;
    content: string;
  }[];
  timestamp: string;
  className?: string;
}

const ResultsDisplay = ({
  imageUrl,
  analysisType,
  results,
  timestamp,
  className,
}: ResultsDisplayProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareNote, setShareNote] = useState('');
  
  // Reference for PDF export
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // Add user message
    setChatMessages([...chatMessages, { sender: 'user', text: inputValue }]);
    setInputValue('');
    setIsWaitingForResponse(true);
    
    // Simulate AI response
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev, 
        { 
          sender: 'ai', 
          text: "I'm a placeholder AI response related to your bone health analysis. In a real implementation, this would provide contextual information about your results." 
        }
      ]);
      setIsWaitingForResponse(false);
    }, 1500);
  };
  
  const handleDownload = async () => {
    if (!resultsRef.current) return;
    
    try {
      toast.info('Generating PDF report...');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      // Add title
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 128); // Dark blue title
      pdf.text(analysisType, 20, 20);
      
      // Add date
      pdf.setFontSize(12);
      pdf.setTextColor(80, 80, 80); // Dark gray text
      pdf.text(`Analysis Date: ${timestamp}`, 20, 30);
      
      // Add a divider line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, 35, 190, 35);
      
      // Create a temporary container to style the results
      const tempContainer = document.createElement('div');
      tempContainer.style.width = '700px'; // Wider to ensure text isn't cut off
      tempContainer.style.padding = '20px';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      
      // Clone the results div to the temp container
      const resultsClone = resultsRef.current.cloneNode(true) as HTMLDivElement;
      tempContainer.appendChild(resultsClone);
      
      // Append to body temporarily (hidden)
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      document.body.appendChild(tempContainer);
      
      // Add image to the report with proper positioning
      if (imageUrl) {
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 128);
        pdf.text('Analyzed Image', 20, 20);
        
        // Create a temporary img element to get the image dimensions
        const img = new Image();
        img.src = imageUrl;
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
        });
        
        // Calculate image dimensions to fit on page while maintaining aspect ratio
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        const maxImgWidth = pageWidth - 40; // 20mm margins on each side
        const maxImgHeight = pageHeight - 50; // Allow space for header and bottom margin
        
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
        
        // Center the image
        const xOffset = (pageWidth - imgWidth) / 2;
        
        pdf.addImage(imageUrl, 'JPEG', xOffset, 30, imgWidth, imgHeight);
      }
      
      // Generate results content in multiple pages if needed
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 128);
      pdf.text('Analysis Results', 20, 20);
      
      // Generate canvas from the temp container with results
      const canvas = await html2canvas(tempContainer, { 
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      // Clean up the temp element
      document.body.removeChild(tempContainer);
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate image dimensions to fit within the page width
      const contentWidth = pdf.internal.pageSize.getWidth() - 40; // 20mm margin on each side
      
      // Calculate the height proportionally
      const contentHeight = canvas.height * contentWidth / canvas.width;
      
      // Split content across multiple pages if needed
      const pageHeight = pdf.internal.pageSize.getHeight() - 40; // 20mm margin top and bottom
      
      // If content fits on one page
      if (contentHeight < pageHeight - 30) { // 30mm for the header
        pdf.addImage(imgData, 'PNG', 20, 30, contentWidth, contentHeight);
      } else {
        // Content needs multiple pages - calculate the number of pages needed
        const pageCount = Math.ceil(contentHeight / pageHeight);
        
        // Scale factors for positioning
        const imgPageHeight = canvas.height / pageCount;
        const pdfPageHeight = contentHeight / pageCount;
        
        // For each page
        for (let i = 0; i < pageCount; i++) {
          if (i > 0) pdf.addPage();
          
          // Calculate the source rectangle to crop from the canvas
          const sy = imgPageHeight * i;
          const sHeight = Math.min(imgPageHeight, canvas.height - sy);
          
          // Calculate the height to use in the PDF
          const pdfImgHeight = Math.min(pdfPageHeight, contentHeight - (pdfPageHeight * i));
          
          // Create a temporary canvas for the current page segment
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
            
            // Add the image segment to the current page
            const yPosition = i === 0 ? 30 : 20; // Account for header on first page
            pdf.addImage(pageImgData, 'PNG', 20, yPosition, contentWidth, pdfImgHeight);
          }
        }
      }
      
      // Add footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.getWidth() - 40, pdf.internal.pageSize.getHeight() - 10);
        pdf.text('AI-powered bone health analysis', 20, pdf.internal.pageSize.getHeight() - 10);
      }
      
      // Save the PDF
      pdf.save(`${analysisType.replace(/\s+/g, '_')}_Report.pdf`);
      
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
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6", className)}>
      {/* Image Card */}
      <Card className="lg:col-span-1 overflow-hidden">
        <div className="aspect-square w-full overflow-hidden">
          <img 
            src={imageUrl} 
            alt="Analyzed medical image" 
            className="h-full w-full object-cover" 
          />
        </div>
        <CardFooter className="p-4 border-t bg-muted/10">
          <div className="w-full flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{timestamp}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={handleDownload}>
                <Download size={18} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShareDialogOpen(true)}>
                <Share2 size={18} />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
      
      {/* Results Card */}
      <Card className="lg:col-span-2 flex flex-col">
        <CardHeader>
          <CardTitle>{analysisType} Results</CardTitle>
          <CardDescription>
            Analysis completed on {timestamp}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-6" ref={resultsRef}>
            {results.map((result, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-base font-medium text-foreground">{result.title}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{result.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t p-4 flex justify-between items-center bg-background">
          <span className="text-xs text-muted-foreground">
            AI analysis is not a substitute for professional medical advice
          </span>
          <Button 
            onClick={toggleChat}
            variant="outline" 
            size="sm" 
            className="gap-2"
          >
            <MessageCircle size={16} />
            Ask about results
          </Button>
        </CardFooter>
      </Card>
      
      {/* Chat Component */}
      {isChatOpen && (
        <div className="lg:col-span-3 animate-fade-in">
          <Card className="border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">AI Assistant</CardTitle>
              <CardDescription>
                Ask questions about your analysis results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] overflow-y-auto mb-4 p-4 border rounded-lg bg-muted/10">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    <p>Ask a question about your results to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map((message, index) => (
                      <div 
                        key={index} 
                        className={cn(
                          "flex",
                          message.sender === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        <div 
                          className={cn(
                            "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                            message.sender === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}
                        >
                          {message.text}
                        </div>
                      </div>
                    ))}
                    {isWaitingForResponse && (
                      <div className="flex justify-start">
                        <div className="bg-muted max-w-[80%] rounded-lg px-4 py-2">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 rounded-full bg-foreground/30 animate-pulse"></div>
                            <div className="h-2 w-2 rounded-full bg-foreground/30 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="h-2 w-2 rounded-full bg-foreground/30 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Type your question here..."
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isWaitingForResponse}
                />
                <Button type="submit" disabled={isWaitingForResponse}>
                  Send
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
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

export default ResultsDisplay;
