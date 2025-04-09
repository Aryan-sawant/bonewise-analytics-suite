
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Home, ArrowRight, Clock, Bone, Calendar, Filter, Download, Share2, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

type FilterOptions = {
  taskTypes: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
};

const AnalysisHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<Analysis[]>([]);
  const [chatInteractions, setChatInteractions] = useState<Record<string, ChatInteraction[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [titleFadeIn, setTitleFadeIn] = useState(false);
  const [contentFadeIn, setContentFadeIn] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareNote, setShareNote] = useState('');
  
  // Filter state
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    taskTypes: [],
    dateRange: {
      start: null,
      end: null
    }
  });
  
  // Extract unique task types
  const uniqueTaskTypes = [...new Set(analyses.map(a => a.task_name))];
  
  // Reference for PDF export
  const resultsRef = useRef<HTMLDivElement>(null);

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
  
  useEffect(() => {
    // Apply filters whenever filterOptions change
    applyFilters();
  }, [filterOptions, analyses]);

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
      setFilteredAnalyses(data || []);

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
  
  const applyFilters = () => {
    let filtered = [...analyses];
    
    // Apply task type filters
    if (filterOptions.taskTypes.length > 0) {
      filtered = filtered.filter(analysis => 
        filterOptions.taskTypes.includes(analysis.task_name)
      );
    }
    
    // Apply date range filters
    if (filterOptions.dateRange.start) {
      filtered = filtered.filter(analysis => 
        new Date(analysis.created_at) >= (filterOptions.dateRange.start as Date)
      );
    }
    
    if (filterOptions.dateRange.end) {
      filtered = filtered.filter(analysis => 
        new Date(analysis.created_at) <= (filterOptions.dateRange.end as Date)
      );
    }
    
    setFilteredAnalyses(filtered);
    
    // Update selected analysis if necessary
    if (filtered.length > 0 && (!selectedAnalysis || !filtered.find(a => a.id === selectedAnalysis))) {
      setSelectedAnalysis(filtered[0].id);
    }
  };
  
  const handleFilterChange = (taskName: string) => {
    setFilterOptions(prev => {
      const taskTypes = prev.taskTypes.includes(taskName)
        ? prev.taskTypes.filter(t => t !== taskName)
        : [...prev.taskTypes, taskName];
      
      return {
        ...prev,
        taskTypes
      };
    });
  };
  
  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    setFilterOptions(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [type]: value ? new Date(value) : null
      }
    }));
  };
  
  const clearFilters = () => {
    setFilterOptions({
      taskTypes: [],
      dateRange: {
        start: null,
        end: null
      }
    });
  };
  
  const handleExport = async () => {
    if (!selectedAnalysis || !resultsRef.current) return;
    
    try {
      toast.info('Generating PDF...');
      
      const analysis = analyses.find(a => a.id === selectedAnalysis);
      if (!analysis) return;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const canvas = await html2canvas(resultsRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      // Add title
      pdf.setFontSize(20);
      pdf.text(analysis.task_name, 20, 20);
      
      // Add date
      pdf.setFontSize(12);
      pdf.text(`Date: ${new Date(analysis.created_at).toLocaleString()}`, 20, 30);
      
      // Add divider
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, 35, 190, 35);
      
      // Add results image
      const imgWidth = 170;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 40, imgWidth, imgHeight);
      
      // Save PDF
      pdf.save(`${analysis.task_name}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };
  
  const handleShare = async () => {
    if (!shareEmail || !selectedAnalysis) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // In a real application, this would send an email with the analysis
    // For now, we'll just show a toast
    toast.success(`Analysis shared with ${shareEmail}`);
    setShareDialogOpen(false);
    setShareEmail('');
    setShareNote('');
  };
  
  // Format results for display (same as before)
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
          variant="gradient"
          onClick={() => navigate('/tasks')}
          className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl"
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
          variant="gradient"
          onClick={() => navigate('/')}
          className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl"
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
          {/* Filter Popover */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
              >
                <Filter size={16} />
                <span>Filter</span>
                {filterOptions.taskTypes.length > 0 && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground">
                    {filterOptions.taskTypes.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filter by Analysis Type</h4>
                  {(filterOptions.taskTypes.length > 0) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      className="h-8 px-2 text-xs"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {uniqueTaskTypes.map(taskName => (
                    <div key={taskName} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`filter-${taskName}`} 
                        checked={filterOptions.taskTypes.includes(taskName)}
                        onCheckedChange={() => handleFilterChange(taskName)}
                      />
                      <Label htmlFor={`filter-${taskName}`}>{taskName}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Date Range Popover */}
          <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
              >
                <Calendar size={16} />
                <span>Date Range</span>
                {(filterOptions.dateRange.start || filterOptions.dateRange.end) && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground">
                    ✓
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filter by Date</h4>
                  {(filterOptions.dateRange.start || filterOptions.dateRange.end) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setFilterOptions(prev => ({
                          ...prev, 
                          dateRange: { start: null, end: null }
                        }));
                      }}
                      className="h-8 px-2 text-xs"
                    >
                      Clear dates
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input 
                        id="start-date" 
                        type="date" 
                        value={filterOptions.dateRange.start ? filterOptions.dateRange.start.toISOString().split('T')[0] : ''}
                        onChange={(e) => handleDateRangeChange('start', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date">End Date</Label>
                      <Input 
                        id="end-date" 
                        type="date" 
                        value={filterOptions.dateRange.end ? filterOptions.dateRange.end.toISOString().split('T')[0] : ''}
                        onChange={(e) => handleDateRangeChange('end', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            disabled={!selectedAnalysisData}
            onClick={handleExport}
          >
            <Download size={16} />
            <span>Export</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            disabled={!selectedAnalysisData}
            onClick={() => setShareDialogOpen(true)}
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
      ) : filteredAnalyses.length === 0 ? (
        <Card className="border shadow-sm hover-card transition-all">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-16 w-16 text-muted-foreground mb-4 animate-pulse" />
            <h3 className="text-xl font-medium mb-2">No Analysis History</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              {analyses.length > 0 ? 
                'No analyses match your current filters.' : 
                'You haven\'t performed any bone health analyses yet.'}
            </p>
            {analyses.length > 0 ? (
              <Button 
                onClick={clearFilters} 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover-scale transition-all"
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            ) : (
              <Button 
                onClick={() => navigate('/bone-analysis')} 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover-scale transition-all"
              >
                <Bone className="mr-2 h-4 w-4" />
                Start Bone Analysis
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="col-span-1 border rounded-xl shadow-sm overflow-hidden hover-card transition-all">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 pb-4">
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                Past Analyses {filteredAnalyses.length !== analyses.length && `(${filteredAnalyses.length}/${analyses.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2">
                {filteredAnalyses.map((analysis) => (
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
                      <div className="prose dark:prose-invert max-w-none" ref={resultsRef}>
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
      
      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Analysis Results</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="recipient@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Add a note (optional)</Label>
              <Input
                id="note"
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

export default AnalysisHistory;
