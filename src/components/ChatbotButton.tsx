
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface ChatbotButtonProps {
  analysisContext?: string;
  taskTitle?: string;
}

interface ChatMessage {
  text: string;
  isUser: boolean;
  isLoading?: boolean;
}

const ChatbotButton: React.FC<ChatbotButtonProps> = ({ analysisContext, taskTitle }) => {
  const { user } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { text: `Hello! I'm your bone health assistant. How can I help you with your ${taskTitle || 'analysis'} results?`, isUser: false }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage = { text: message, isUser: true };
    setMessages([...messages, userMessage]);
    
    // Add loading indicator
    setMessages(prev => [...prev, { text: '', isUser: false, isLoading: true }]);
    
    // Clear input field
    setMessage('');
    setIsLoading(true);
    
    try {
      // Prepare the context for Gemini
      const contextPrompt = `
        You are a professional bone health assistant helping with medical image analysis results.
        The user is asking about this analysis result: "${taskTitle || 'bone analysis'}"
        
        Context from the analysis:
        ${analysisContext || 'No analysis data available.'}
        
        Please respond to the user's question in a professional, helpful way. Format your response
        naturally without using markdown. Be direct, informative, and use paragraph breaks for readability.
      `;
      
      // Call Gemini via the edge function
      const { data, error } = await supabase.functions.invoke('chat-with-gemini', {
        body: {
          message: message,
          context: contextPrompt,
          userType: user?.userType || 'common'
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Remove loading message
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      
      // Add AI response
      const botResponse: ChatMessage = { 
        text: data.response || "I'm sorry, I couldn't generate a response. Please try again.", 
        isUser: false 
      };
      
      setMessages(prev => [...prev, botResponse]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove loading message
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      // Add error message
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
      <Button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 p-0 shadow-lg bg-primary hover:bg-primary/90"
        size="icon"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </Button>

      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 max-h-[70vh] shadow-lg animate-fade-in z-50">
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
            <div className="h-[40vh] overflow-y-auto p-4 space-y-3" id="chat-messages">
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
                          ? 'bg-primary text-primary-foreground rounded-tr-none' 
                          : 'bg-muted rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              ))}
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
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage} 
                size="icon" 
                disabled={isLoading || !message.trim()}
                className="bg-primary hover:bg-primary/90"
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
