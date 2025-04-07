
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Home, ArrowRight, Clock, Bone, Calendar, Filter, Download, Share2 } from 'lucide-react';

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
  const location = useLocation();
  const { user } = useAuthContext();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [chatInteractions, setChatInteractions] = useState<Record<string, ChatInteraction[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [titleFadeIn, setTitleFadeIn] = useState(false);
  const [contentFadeIn, setContentFadeIn] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchAnalyses();

    // Fade in title after a short delay on page load
    setTimeout(() => {
      setTitleFadeIn(true);
    }, 100);
  }, [user, navigate]);

  useEffect(() => {
    // Trigger content fade-in when selectedAnalysis changes
    setContentFadeIn(false);
    setTimeout(() => {
      setContentFadeIn(true);
    }, 100);
  }, [selectedAnalysis]);

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

    // Remove code blocks
    const textWithoutCodeBlocks = resultsText.replace(/```[\s\S]*?```/g, '');

    const paragraphs = textWithoutCodeBlocks.split(/\n\n+/);
    return (
      <div className="space-y-4 leading-relaxed">
        {paragraphs.map((para, index) => {
          if (para.match(/^#+\s/) || para.match(/^(Summary|Findings|Interpretation|Recommendations|Assessment|Diagnosis|Conclusion):/i)) {
            const headingText = para.replace(/^#+\s/, '').replace(/^(Summary|Findings|Interpretation|Recommendations|Assessment|Diagnosis|Conclusion):/i, '$1');
            return <h3 key={index} className="text-xl font-bold mt-6 first:mt-0 text-primary/90 border-b pb-1">{headingText}</h3>;
          }

          if (para.includes('• ') || para.includes('- ') || para.includes('* ')) {
            const listItems = para.split(/[•\-*]\s+/).filter(Boolean);
            return (
              <ul key={index} className="list-disc pl-5 space-y-2">
                {listItems.map((item, i) => (
                  <li key={i} className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: item.trim() }} />
                ))}
              </ul>
            );
          }

          return <p key={index} className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: para.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>') }} />;
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
      <style>
        {`
        .hover-scale {
          transition: transform 0.2s ease-out;
        }

        .hover-scale:hover {
          transform: scale(1.05);
        }

        .hover-card {
          transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
        }

        .hover-card:hover {
          transform: translateZ(5px) translateY(-3px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }

        .hover-list-item {
          transition: all 0.2s ease-out;
          border-left: 3px solid transparent;
        }

        .hover-list-item:hover {
          border-left-color: var(--primary);
          background-color: rgba(var(--primary-rgb), 0.05);
          padding-left: 6px;
        }

        .hover-list-item.active {
          border-left-color: var(--primary);
          background-color: rgba(var(--primary-rgb), 0.1);
          padding-left: 6px;
        }

        .hover-tab-trigger {
          transition: background-color 0.2s ease-out, color 0.2s ease-out;
        }

        .hover-tab-trigger:hover {
          background-color: rgba(var(--primary-rgb), 0.1);
          color: var(--primary);
        }

        .hover-image-card {
          transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
        }

        .hover-image-card:hover {
          transform: scale(1.02) translateZ(3px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }

        .hover-message, .hover-ai-message {
          transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
        }

        .hover-message:hover, .hover-ai-message:hover {
          transform: translateY(-2px) translateZ(2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .animate-gradient-bg {
          background-size: 300%;
          animation: gradient-animation 15s ease infinite;
        }

        @keyframes gradient-animation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .fade-in-title {
          opacity: 0;
          transform: translateY(-10px);
          transition: opacity 0.5s ease-out, transform 0.5s ease-out;
        }

        .fade-in-title.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .fade-in-content {
          opacity: 0;
          transition: opacity 0.4s ease-out;
        }

        .fade-in-content.visible {
          opacity: 1;
        }
        `}
      </style>
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/tasks')}
          className="group hover-scale transition-all active:scale-95 text-blue-500 hover:text-blue-600 border-blue-500 hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <svg 
            className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="hover-scale transition-all active:scale-95 text-blue-500 hover:text-blue-600 border-blue-500 hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <Home className="mr-2 h-4 w-4" />
          Home
        </Button>
      </div>

      <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-6 rounded-2xl mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${titleFadeIn ? 'fade-in-title visible' : 'fade-in-title'}`}>Analysis History</h1>
        <p className="text-muted-foreground">
          View your past bone health analyses and chatbot interactions
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <Filter size={16} />
            <span>Filter</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
          >
            <Calendar size={16} />
            <span>Date Range</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            disabled={!selectedAnalysisData}
          >
            <Download size={16} />
            <span>Export</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            disabled={!selectedAnalysisData}
          >
            <Share2 size={16} />
            <span>Share</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Bone className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      ) : analyses.length === 0 ? (
        <Card className="border shadow-sm hover-card transition-all">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-16 w-16 text-muted-foreground mb-4 animate-pulse" />
            <h3 className="text-xl font-medium mb-2">No Analysis History</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              You haven't performed any bone health analyses yet.
              Start by analyzing an image to build your history.
            </p>
            <Button 
              onClick={() => navigate('/bone-analysis')} 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover-scale transition-all"
            >
              <Bone className="mr-2 h-4 w-4" />
              Start Bone Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="col-span-1 border rounded-xl shadow-sm overflow-hidden hover-card transition-all">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 pb-4">
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                Past Analyses
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2">
                {analyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all hover-list-item ${
                      selectedAnalysis === analysis.id ? 'active bg-primary/10' : ''
                    }`}
                    onClick={() => handleSelectAnalysis(analysis.id)}
                  >
                    <div className="font-medium">{analysis.task_name}</div>
                    <div className="text-xs mt-1 flex items-center text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(analysis.created_at).toLocaleDateString()} · 
                      <Clock className="h-3 w-3 mx-1" />
                      {new Date(analysis.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-2 border shadow-sm rounded-xl overflow-hidden hover-card transition-all">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 pb-4">
              <CardTitle className="flex items-center">
                {selectedAnalysisData ? (
                  <>
                    <Bone className="h-5 w-5 mr-2 text-primary" />
                    {selectedAnalysisData.task_name}
                  </>
                ) : (
                  'Analysis Details'
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className={`pt-4 ${contentFadeIn ? 'fade-in-content visible' : 'fade-in-content'}`}>
              {selectedAnalysisData ? (
                <Tabs defaultValue="results" className="w-full">
                  <TabsList className="mb-4 w-full bg-muted/50">
                    <TabsTrigger 
                      value="results" 
                      className="hover-tab-trigger transition-colors data-[state=active]:bg-primary/10"
                    >
                      Analysis Results
                    </TabsTrigger>
                    <TabsTrigger 
                      value="chat" 
                      className="hover-tab-trigger transition-colors data-[state=active]:bg-primary/10"
                    >
                      Chat History
                    </TabsTrigger>
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
                      <div className="mt-6 border rounded-xl p-4 hover-image-card transition-all overflow-hidden">
                        <h3 className="font-medium mb-2 flex items-center">
                          <svg 
                            className="h-4 w-4 mr-2" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                            />
                          </svg>
                          Analyzed Image
                        </h3>
                        <div className="flex justify-center">
                          <img
                            src={selectedAnalysisData.image_url}
                            alt="Analyzed bone"
                            className="max-h-64 object-contain rounded-lg hover:scale-[1.02] transition-transform cursor-zoom-in"
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
                              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-lg rounded-tr-none max-w-[80%] hover-message transition-all">
                                {chat.user_message}
                              </div>
                            </div>
                            <div className="flex justify-start">
                              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg rounded-tl-none max-w-[80%] hover-ai-message transition-all">
                                {chat.ai_response}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                          <svg 
                            className="h-8 w-8 text-gray-400" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                            />
                          </svg>
                        </div>
                        <p className="text-muted-foreground">No chat interactions for this analysis</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4 hover-scale transition-all"
                          onClick={() => navigate(`/analysis/${selectedAnalysisData.task_id}`)}
                        >
                          Start a Conversation
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
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
