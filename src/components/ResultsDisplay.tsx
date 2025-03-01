
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { MessageCircle, Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

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
  
  const handleDownload = () => {
    // In a real app, this would generate a PDF report
    toast.success('Download feature will be implemented in the future');
  };
  
  const handleShare = () => {
    // In a real app, this would open a share dialog
    toast.success('Share feature will be implemented in the future');
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
              <Button variant="ghost" size="icon" onClick={handleShare}>
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
          <div className="space-y-6">
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
    </div>
  );
};

export default ResultsDisplay;
