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
import { supabase } from '@/integrations/supabase/client';

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
    
    setChatMessages([...chatMessages, { sender: 'user', text: inputValue }]);
    setInputValue('');
    setIsWaitingForResponse(true);
    
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
      
      pdf.setFontSize(16);
      pdf.text(analysisType, 20, 20);
      
      pdf.setFontSize(12);
      pdf.text(`Analysis Date: ${timestamp}`, 20, 30);
      
      if (imageUrl) {
        pdf.addPage();
        pdf.text("Analyzed Image", 20, 20);
        
        try {
          const img = new Image();
          img.src = imageUrl;
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
          
          const pageWidth = pdf.internal.pageSize.getWidth();
          const maxWidth = pageWidth - 40;
          
          let imgWidth = Math.min(img.width, maxWidth);
          let imgHeight = img.height * (imgWidth / img.width);
          
          if (imgHeight > 200) {
            imgHeight = 200;
            imgWidth = img.width * (imgHeight / img.height);
          }
          
          const xOffset = (pageWidth - imgWidth) / 2;
          pdf.addImage(imageUrl, 'JPEG', xOffset, 30, imgWidth, imgHeight);
        } catch (imgErr) {
          console.error("Image error:", imgErr);
          pdf.text("Image could not be loaded", 20, 40);
        }
      }
      
      pdf.addPage();
      pdf.text("Analysis Results", 20, 20);
      
      let yPosition = 40;
      results.forEach(result => {
        pdf.setFontSize(14);
        pdf.text(result.title, 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        
        const contentWidth = pdf.internal.pageSize.getWidth() - 40;
        const contentLines = pdf.splitTextToSize(result.content, contentWidth);
        
        contentLines.forEach(line => {
          if (yPosition > pdf.internal.pageSize.getHeight() - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.text(line, 20, yPosition);
          yPosition += 6;
        });
        
        yPosition += 10;
      });
      
      const cleanTitle = analysisType.replace(/\s+/g, '_').toLowerCase();
      const date = new Date().toISOString().split('T')[0];
      pdf.save(`${cleanTitle}_${date}.pdf`);
      
      toast.success('PDF downloaded');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };
  
  const handleShare = async () => {
    if (!shareEmail) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    const toastId = toast.loading(`Sharing results with ${shareEmail}...`);
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      pdf.setFontSize(16);
      pdf.text(analysisType, 20, 20);
      
      pdf.setFontSize(12);
      pdf.text(`Analysis Date: ${timestamp}`, 20, 30);
      
      if (imageUrl) {
        pdf.addPage();
        pdf.text("Analyzed Image", 20, 20);
        
        try {
          const img = new Image();
          img.src = imageUrl;
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const maxImgWidth = pdfWidth - 40;
          let imgWidth = Math.min(img.width, maxImgWidth);
          let imgHeight = img.height * (imgWidth / img.width);
          
          if (imgHeight > 200) {
            imgHeight = 200;
            imgWidth = img.width * (imgHeight / img.height);
          }
          
          const xOffset = (pdfWidth - imgWidth) / 2;
          pdf.addImage(imageUrl, 'JPEG', xOffset, 30, imgWidth, imgHeight);
        } catch (imgErr) {
          console.error("Image error:", imgErr);
        }
      }
      
      pdf.addPage();
      pdf.text("Analysis Results", 20, 20);
      
      let yPosition = 40;
      results.forEach(result => {
        pdf.setFontSize(14);
        pdf.text(result.title, 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const contentLines = pdf.splitTextToSize(result.content, pdfWidth - 40);
        contentLines.forEach(line => {
          if (yPosition > pdf.internal.pageSize.getHeight() - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.text(line, 20, yPosition);
          yPosition += 6;
        });
        
        yPosition += 10;
      });
      
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      
      const { data, error } = await supabase.functions.invoke("share-results", {
        body: {
          to: shareEmail,
          subject: `${analysisType} Analysis Results`,
          pdfBase64,
          message: shareNote || `Here are the analysis results for ${analysisType}`,
          analysisType,
          timestamp
        },
      });
      
      if (error) throw new Error(error.message);
      
      toast.success(`Results shared with ${shareEmail}`, { id: toastId });
      setShareDialogOpen(false);
      setShareEmail('');
      setShareNote('');
    } catch (error) {
      console.error('Error sharing results:', error);
      toast.error(`Failed to share results: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: toastId });
    }
  };
  
  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6", className)}>
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
