
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, X, Loader2, Maximize, Minimize, BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ChatbotButtonProps {
  analysisContext: string;
  taskTitle: string;
  analysisId: string;
  className?: string;
}

interface ChatMessage {
  text: string;
  isUser: boolean;
  isLoading?: boolean;
}

const ChatbotButton: React.FC<ChatbotButtonProps> = ({ analysisContext, taskTitle, analysisId, className }) => {
  const { user } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { text: `Hello! I'm your bone health assistant. How can I help you with your ${taskTitle || 'analysis'} results?`, isUser: false }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    const userMessage = { text: message, isUser: true };
    setMessages([...messages, userMessage]);
    
    setMessages(prev => [...prev, { text: '', isUser: false, isLoading: true }]);
    
    setMessage('');
    setIsLoading(true);
    
    try {
      const contextPrompt = `
        You are a professional bone health assistant helping with medical image analysis results.
        The user is asking about this analysis result: "${taskTitle || 'bone analysis'}"
        
        Context from the analysis:
        ${analysisContext || 'No analysis data available.'}
        
        Please respond to the user's question in a professional, helpful way. Format your response
        naturally without using markdown. Be direct, informative, and use paragraph breaks for readability.
        Make sure to format important information using HTML <b> tags for bold (not markdown asterisks).
      `;
      
      const { data, error } = await supabase.functions.invoke('chat-with-gemini', {
        body: {
          message: message,
          context: contextPrompt,
          userType: user?.userType || 'common',
          userId: user?.id,
          analysisId: analysisId
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      
      const botResponse: ChatMessage = { 
        text: data.response || "I'm sorry, I couldn't generate a response. Please try again.", 
        isUser: false 
      };
      
      setMessages(prev => [...prev, botResponse]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      setMessages(prev => [...prev, { 
        text: "I'm sorry, I encountered an error processing your request. Please try again.", 
        isUser: false 
      }]);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            onClick={toggleChat}
            className="fixed bottom-6 right-6 rounded-full h-14 w-14 p-0 shadow-xl bg-gradient-to-r from-primary to-primary/80 hover:shadow-primary/20 transition-all duration-300 transform hover:scale-105 z-50"
            size="icon"
          >
            {isOpen ? <X size={24} className="text-primary-foreground" /> : <MessageCircle size={24} className="text-primary-foreground" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px] border-none shadow-none bg-transparent">
          <div className="text-center text-xs text-muted-foreground p-2 bg-background/80 backdrop-blur-sm rounded-lg shadow-sm">
            Ask me anything about your bone health analysis
          </div>
        </PopoverContent>
      </Popover>

      {isOpen && (
        <Card 
          className={`fixed ${isMaximized ? 'inset-4 max-h-none' : 'bottom-24 right-6 w-96 max-h-[70vh]'} shadow-xl bg-background/95 backdrop-blur-md border border-primary/10 rounded-xl animate-fade-in z-50 transition-all duration-300 ${className}`}
        >
          <CardHeader className="bg-gradient-to-r from-primary to-primary/80 rounded-t-xl p-4">
            <CardTitle className="text-base flex justify-between items-center text-primary-foreground">
              <div className="flex items-center gap-2">
                <BrainCircuit size={18} className="text-primary-foreground" />
                <span>Bone Health AI Assistant</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleMaximize}
                  className="h-8 w-8 text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary/80 transition-all duration-300 transform hover:scale-110"
                >
                  {isMaximized ? <Minimize size={16} /> : <Maximize size={16} />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleChat}
                  className="h-8 w-8 text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary/80 transition-all duration-300 transform hover:scale-110"
                >
                  <X size={16} />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div 
              className={`${isMaximized ? 'h-[calc(100vh-14rem)]' : 'h-[40vh]'} overflow-y-auto p-4 space-y-3 scrollbar-none`} 
              id="chat-messages"
            >
              {messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.isLoading ? (
                    <div className="max-w-[80%] p-3 rounded-lg bg-muted rounded-tl-none">
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.isUser 
                          ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-tr-none shadow-md transition-all duration-300 transform hover:scale-105' 
                          : 'bg-muted/80 backdrop-blur-sm rounded-tl-none shadow-sm transition-all duration-300 transform hover:scale-105'
                      }`}
                    >
                      <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
          <CardFooter className="p-3 border-t border-border/20">
            <div className="flex w-full gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about your analysis..."
                className="flex-1 border rounded-full px-4 py-2 text-sm transition-all duration-300 focus:ring-2 focus:ring-primary focus:border-primary bg-background/50 backdrop-blur-sm"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage} 
                size="icon" 
                disabled={isLoading || !message.trim()}
                className="rounded-full bg-gradient-to-r from-primary to-primary/80 hover:bg-primary/90 transition-all duration-300 transform hover:scale-110"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  );
};

export default ChatbotButton;
