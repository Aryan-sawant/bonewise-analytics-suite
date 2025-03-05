
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Home, ArrowRight, Clock, Bone } from 'lucide-react';

interface Analysis {
  id: string;
  task_id: string;
  task_name: string;
  image_url: string | null;
  result_text: string | null;
  created_at: string;
}

interface ChatInteraction {
  id: string;
  analysis_id: string;
  user_message: string;
  ai_response: string;
  created_at: string;
}

const AnalysisHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [chatInteractions, setChatInteractions] = useState<Record<string, ChatInteraction[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchAnalyses();
  }, [user, navigate]);
  
  const fetchAnalyses = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      setAnalyses(data || []);
      
      if (data && data.length > 0) {
        setSelectedAnalysis(data[0].id);
        await fetchChatInteractions(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast.error('Failed to load analysis history');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchChatInteractions = async (analysisId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_interactions')
        .select('*')
        .eq('analysis_id', analysisId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      setChatInteractions(prev => ({
        ...prev,
        [analysisId]: data || []
      }));
    } catch (error) {
      console.error('Error fetching chat interactions:', error);
    }
  };
  
  const handleSelectAnalysis = async (analysisId: string) => {
    setSelectedAnalysis(analysisId);
    
    if (!chatInteractions[analysisId]) {
      await fetchChatInteractions(analysisId);
    }
  };
  
  const formatResults = (resultsText: string) => {
    if (!resultsText) return null;
    
    // Split into paragraphs and format
    const paragraphs = resultsText.split(/\n\n+/);
    return (
      <div className="space-y-4">
        {paragraphs.map((para, index) => {
          // Check if this paragraph looks like a heading (short and followed by a paragraph)
          const isHeading = para.length < 50 && !para.includes('.') && paragraphs[index + 1];
          
          if (isHeading) {
            return <h3 key={index} className="text-lg font-bold mt-6 first:mt-0">{para}</h3>;
          }
          
          // Check for bullet points
          if (para.includes('• ') || para.includes('- ')) {
            const listItems = para.split(/[•\-]\s+/).filter(Boolean);
            return (
              <ul key={index} className="list-disc pl-5 space-y-1">
                {listItems.map((item, i) => (
                  <li key={i}>{item.trim()}</li>
                ))}
              </ul>
            );
          }
          
          // Regular paragraph
          return <p key={index}>{para}</p>;
        })}
      </div>
    );
  };
  
  const getAnalysisById = (id: string | null) => {
    if (!id) return null;
    return analyses.find(analysis => analysis.id === id) || null;
  };
  
  const selectedAnalysisData = getAnalysisById(selectedAnalysis);
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/tasks')}
          className="hover-scale"
        >
          ← Back to Dashboard
        </Button>
        
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="hover-scale"
        >
          <Home className="mr-2 h-4 w-4" />
          Home
        </Button>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">Analysis History</h1>
      <p className="text-muted-foreground mb-8">
        View your past bone health analyses and chatbot interactions
      </p>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : analyses.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No Analysis History</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              You haven't performed any bone health analyses yet. 
              Start by analyzing an image to build your history.
            </p>
            <Button onClick={() => navigate('/bone-analysis')}>
              <Bone className="mr-2 h-4 w-4" />
              Start Bone Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="col-span-1 border shadow-sm">
            <CardHeader>
              <CardTitle>Past Analyses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {analyses.map((analysis) => (
                  <div 
                    key={analysis.id} 
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedAnalysis === analysis.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => handleSelectAnalysis(analysis.id)}
                  >
                    <div className="font-medium">{analysis.task_name}</div>
                    <div className="text-xs mt-1">
                      {new Date(analysis.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 lg:col-span-2 border shadow-sm">
            <CardHeader>
              <CardTitle>
                {selectedAnalysisData ? selectedAnalysisData.task_name : 'Analysis Details'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedAnalysisData ? (
                <Tabs defaultValue="results">
                  <TabsList className="mb-4">
                    <TabsTrigger value="results">Analysis Results</TabsTrigger>
                    <TabsTrigger value="chat">Chat History</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="results" className="space-y-4">
                    {selectedAnalysisData.result_text ? (
                      <div className="prose dark:prose-invert max-w-none">
                        {formatResults(selectedAnalysisData.result_text)}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No analysis results available</p>
                    )}
                    
                    {selectedAnalysisData.image_url && (
                      <div className="mt-6 border rounded p-4">
                        <h3 className="font-medium mb-2">Analyzed Image</h3>
                        <div className="flex justify-center">
                          <img 
                            src={selectedAnalysisData.image_url} 
                            alt="Analyzed bone" 
                            className="max-h-64 object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="chat">
                    {chatInteractions[selectedAnalysisData.id]?.length > 0 ? (
                      <div className="space-y-4">
                        {chatInteractions[selectedAnalysisData.id].map((chat, index) => (
                          <div key={chat.id} className="space-y-2">
                            <div className="flex justify-end">
                              <div className="bg-primary text-primary-foreground p-3 rounded-lg rounded-tr-none max-w-[80%]">
                                {chat.user_message}
                              </div>
                            </div>
                            <div className="flex justify-start">
                              <div className="bg-muted p-3 rounded-lg rounded-tl-none max-w-[80%]">
                                {chat.ai_response}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No chat interactions for this analysis</p>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex justify-center items-center h-64 text-muted-foreground">
                  Select an analysis to view details
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AnalysisHistory;
