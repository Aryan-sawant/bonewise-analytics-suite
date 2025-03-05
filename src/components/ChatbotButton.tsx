
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, X } from 'lucide-react';
import { toast } from 'sonner';

interface ChatbotButtonProps {
  analysisContext?: string;
  taskTitle?: string;
}

const ChatbotButton: React.FC<ChatbotButtonProps> = ({ analysisContext, taskTitle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([
    { text: `Hello! I'm your bone health assistant. How can I help you with your ${taskTitle || 'analysis'} results?`, isUser: false }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage = { text: message, isUser: true };
    setMessages([...messages, userMessage]);
    
    // Clear input field
    setMessage('');
    setIsLoading(true);
    
    try {
      // In a real implementation, you would send the message to a backend API
      // along with the analysis context to get a relevant response
      // For now, we'll simulate a response with the context
      
      setTimeout(() => {
        const botResponse = { 
          text: `Based on your ${taskTitle || 'analysis'} results, I can help answer your question about "${message}". ${analysisContext ? 'The analysis showed: ' + analysisContext.substring(0, 100) + '...' : 'Please upload an image for analysis first.'}`, 
          isUser: false 
        };
        setMessages(prev => [...prev, botResponse]);
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 p-0 shadow-lg"
        size="icon"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </Button>

      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 max-h-[70vh] shadow-lg animate-fade-in">
          <CardHeader className="bg-primary text-primary-foreground">
            <CardTitle className="text-lg flex justify-between items-center">
              Bone Health Assistant
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleChat}
                className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary/80"
              >
                <X size={18} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[40vh] overflow-y-auto p-4 space-y-3">
              {messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.isUser 
                        ? 'bg-primary text-primary-foreground rounded-tr-none' 
                        : 'bg-muted rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg bg-muted rounded-tl-none">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-3 pt-0">
            <div className="flex w-full gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about your analysis..."
                className="flex-1 border rounded-md p-2 text-sm"
              />
              <Button 
                onClick={handleSendMessage} 
                size="icon" 
                disabled={isLoading || !message.trim()}
              >
                <Send size={18} />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  );
};

export default ChatbotButton;
