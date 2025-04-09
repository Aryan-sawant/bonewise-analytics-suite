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

// --- Interfaces remain the same ---
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
// --- End Interfaces ---

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
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ taskTypes: [], dateRange: { start: null, end: null } });
  const uniqueTaskTypes = [...new Set(analyses.map(a => a.task_name))];
  const resultsRef = useRef<HTMLDivElement>(null);

  // --- useEffect hooks remain the same ---
    useEffect(() => {
        if (!user) { navigate('/auth'); return; }
        fetchAnalyses();
        setTimeout(() => { setTitleFadeIn(true); }, 100);
    }, [user, navigate]);

    useEffect(() => {
        setContentFadeIn(false);
        setTimeout(() => { setContentFadeIn(true); }, 100);
    }, [selectedAnalysis]);

    useEffect(() => {
        applyFilters();
    }, [filterOptions, analyses]);
  // --- End useEffect hooks ---

  // --- Data fetching functions remain the same ---
    const fetchAnalyses = async () => {
        if (!user) return;
        setLoading(true);
        try {
        const { data, error } = await supabase.from('analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (error) throw error;
        const fetchedAnalyses = data || [];
        setAnalyses(fetchedAnalyses);
        setFilteredAnalyses(fetchedAnalyses); // Initialize filtered with all
        if (fetchedAnalyses.length > 0) {
            const initialSelectedId = fetchedAnalyses[0].id;
            setSelectedAnalysis(initialSelectedId);
            await fetchChatInteractions(initialSelectedId);
        }
        } catch (error) {
        console.error('Error fetching analyses:', error);
        toast.error('Failed to load analysis history');
        } finally {
        setLoading(false);
        }
    };

    const fetchChatInteractions = async (analysisId: string) => {
        if (!user || chatInteractions[analysisId]) return; // Avoid refetching if already loaded
        try {
        const { data, error } = await supabase.from('chat_interactions').select('*').eq('analysis_id', analysisId).eq('user_id', user.id).order('created_at', { ascending: true });
        if (error) throw error;
        setChatInteractions(prev => ({ ...prev, [analysisId]: data || [] }));
        } catch (error) { console.error('Error fetching chat interactions:', error); }
    };
  // --- End Data fetching ---

  // --- Handler functions remain the same ---
    const handleSelectAnalysis = async (analysisId: string) => {
        setSelectedAnalysis(analysisId);
        await fetchChatInteractions(analysisId); // Ensure interactions are fetched
    };

    const applyFilters = () => {
        let filtered = [...analyses];
        if (filterOptions.taskTypes.length > 0) { filtered = filtered.filter(a => filterOptions.taskTypes.includes(a.task_name)); }
        if (filterOptions.dateRange.start) { filtered = filtered.filter(a => new Date(a.created_at) >= (filterOptions.dateRange.start as Date)); }
        if (filterOptions.dateRange.end) { filtered = filtered.filter(a => new Date(a.created_at) <= (filterOptions.dateRange.end as Date)); }
        setFilteredAnalyses(filtered);
        if (filtered.length > 0 && (!selectedAnalysis || !filtered.find(a => a.id === selectedAnalysis))) { setSelectedAnalysis(filtered[0].id); }
        else if (filtered.length === 0) { setSelectedAnalysis(null); } // Clear selection if no results
    };

    const handleFilterChange = (taskName: string) => { setFilterOptions(prev => ({ ...prev, taskTypes: prev.taskTypes.includes(taskName) ? prev.taskTypes.filter(t => t !== taskName) : [...prev.taskTypes, taskName] })); };
    const handleDateRangeChange = (type: 'start' | 'end', value: string) => { setFilterOptions(prev => ({ ...prev, dateRange: { ...prev.dateRange, [type]: value ? new Date(value) : null } })); };
    const clearFilters = () => { setFilterOptions({ taskTypes: [], dateRange: { start: null, end: null } }); };

    const handleExport = async () => { /* PDF Export logic remains the same */
        if (!selectedAnalysis || !resultsRef.current) return;
        try {
            toast.info('Generating PDF...');
            const analysis = analyses.find(a => a.id === selectedAnalysis); if (!analysis) return;
            const pdf = new jsPDF('p', 'mm', 'a4'); const canvas = await html2canvas(resultsRef.current, { scale: 2 }); const imgData = canvas.toDataURL('image/png');
            pdf.setFontSize(20); pdf.text(analysis.task_name, 20, 20); pdf.setFontSize(12); pdf.text(`Date: ${new Date(analysis.created_at).toLocaleString()}`, 20, 30); pdf.setDrawColor(200, 200, 200); pdf.line(20, 35, 190, 35);
            const imgWidth = 170; const imgHeight = canvas.height * imgWidth / canvas.width; pdf.addImage(imgData, 'PNG', 20, 40, imgWidth, imgHeight);
            pdf.save(`${analysis.task_name}_${new Date().toISOString().split('T')[0]}.pdf`); toast.success('PDF exported successfully');
        } catch (error) { console.error('Error exporting PDF:', error); toast.error('Failed to export PDF'); }
    };

    const handleShare = async () => { /* Share logic remains the same */
        if (!shareEmail || !selectedAnalysis) { toast.error('Please enter a valid email address'); return; }
        toast.success(`Analysis shared with ${shareEmail}`); setShareDialogOpen(false); setShareEmail(''); setShareNote('');
    };

    const formatResults = (resultsText: string) => { /* Formatting logic remains the same */
        if (!resultsText) return null;
        const textWithoutCodeBlocks = resultsText.replace(/```[\s\S]*?```/g, '');
        const paragraphs = textWithoutCodeBlocks.split(/\n\n+/);
        return ( <div className="space-y-4 leading-relaxed"> {paragraphs.map((para, index) => {
            if (para.match(/^#+\s/) || para.match(/^(Summary|Findings|Interpretation|Recommendations|Assessment|Diagnosis|Conclusion):/i)) { const headingText = para.replace(/^#+\s/, '').replace(/^(Summary|Findings|Interpretation|Recommendations|Assessment|Diagnosis|Conclusion):/i, '$1'); return <h3 key={index} className="text-xl font-bold mt-6 first:mt-0 text-primary/90 border-b pb-1">{headingText}</h3>; }
            if (para.includes('• ') || para.includes('- ') || para.includes('* ')) { const listItems = para.split(/[•\-*]\s+/).filter(Boolean); return ( <ul key={index} className="list-disc pl-5 space-y-2"> {listItems.map((item, i) => ( <li key={i} className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: item.trim() }} /> ))} </ul> ); }
            return <p key={index} className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: para.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>') }} />;
        })} </div> );
    };

    const getAnalysisById = (id: string | null) => { if (!id) return null; return analyses.find(analysis => analysis.id === id) || null; };
  // --- End Handler functions ---

  const selectedAnalysisData = getAnalysisById(selectedAnalysis);

  return (
    <div className="container mx-auto px-4 py-12">
      <style>
        {/* Styles remain the same */}
        {`
        .hover-scale { transition: transform 0.2s ease-out; } .hover-scale:hover { transform: scale(1.05); }
        .hover-card { transition: transform 0.3s ease-out, box-shadow 0.3s ease-out; } .hover-card:hover { transform: translateZ(5px) translateY(-3px); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12); }
        .hover-list-item { transition: all 0.2s ease-out; border-left: 3px solid transparent; } .hover-list-item:hover { border-left-color: var(--primary); background-color: rgba(var(--primary-rgb), 0.05); padding-left: 6px; }
        .hover-list-item.active { border-left-color: var(--primary); background-color: rgba(var(--primary-rgb), 0.1); padding-left: 6px; }
        .hover-tab-trigger { transition: background-color 0.2s ease-out, color 0.2s ease-out; } .hover-tab-trigger:hover { background-color: rgba(var(--primary-rgb), 0.1); color: var(--primary); }
        .hover-image-card { transition: transform 0.3s ease-out, box-shadow 0.3s ease-out; } .hover-image-card:hover { transform: scale(1.02) translateZ(3px); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15); }
        .hover-message, .hover-ai-message { transition: transform 0.2s ease-out, box-shadow 0.2s ease-out; } .hover-message:hover, .hover-ai-message:hover { transform: translateY(-2px) translateZ(2px); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
        .animate-gradient-bg { background-size: 300%; animation: gradient-animation 15s ease infinite; } @keyframes gradient-animation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .fade-in-title { opacity: 0; transform: translateY(-10px); transition: opacity 0.5s ease-out, transform 0.5s ease-out; } .fade-in-title.visible { opacity: 1; transform: translateY(0); }
        .fade-in-content { opacity: 0; transition: opacity 0.4s ease-out; } .fade-in-content.visible { opacity: 1; }
        `}
      </style>

      {/* Top Buttons remain the same */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="gradient" onClick={() => navigate('/tasks')} className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl">
          <svg className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /> </svg> Back to Dashboard
        </Button>
        <Button variant="gradient" onClick={() => navigate('/')} className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl"> <Home className="mr-2 h-4 w-4" /> Home </Button>
      </div>

      {/* Page Title Block remains the same */}
      <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-6 rounded-2xl mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${titleFadeIn ? 'fade-in-title visible' : 'fade-in-title'}`}>Analysis History</h1>
        <p className="text-muted-foreground"> View your past bone health analyses and chatbot interactions </p>
      </div>

      {/* Filter/Export Buttons remain the same */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild> <Button variant="outline" size="sm" className="flex items-center gap-2"> <Filter size={16} /> <span>Filter</span> {filterOptions.taskTypes.length > 0 && ( <span className="ml-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground"> {filterOptions.taskTypes.length} </span> )} </Button> </PopoverTrigger>
            <PopoverContent className="w-80"> {/* Filter Content */} </PopoverContent>
          </Popover>
          <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
            <PopoverTrigger asChild> <Button variant="outline" size="sm" className="flex items-center gap-2"> <Calendar size={16} /> <span>Date Range</span> {(filterOptions.dateRange.start || filterOptions.dateRange.end) && ( <span className="ml-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground"> ✓ </span> )} </Button> </PopoverTrigger>
            <PopoverContent className="w-80"> {/* Date Range Content */} </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2" disabled={!selectedAnalysisData} onClick={handleExport}> <Download size={16} /> <span>Export</span> </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2" disabled={!selectedAnalysisData} onClick={() => setShareDialogOpen(true)}> <Share2 size={16} /> <span>Share</span> </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex justify-center items-center h-64"> <div className="relative"> <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div> <div className="absolute inset-0 flex items-center justify-center"> <Bone className="h-6 w-6 text-primary" /> </div> </div> </div>
      ) : filteredAnalyses.length === 0 ? (
        <Card className="border shadow-sm hover-card transition-all"> {/* No Results Card */} </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Past Analyses List Card */}
          <Card className="col-span-1 border rounded-xl shadow-sm overflow-hidden hover-card transition-all">
            {/* --- MODIFIED CARD HEADER 1 --- */}
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-primary-foreground rounded-t-xl pb-4">
              <CardTitle className="flex items-center text-primary-foreground"> {/* Ensure text color */}
                <Clock className="h-5 w-5 mr-2" /> {/* Icon color inherits */}
                Past Analyses {filteredAnalyses.length !== analyses.length && `(${filteredAnalyses.length}/${analyses.length})`}
              </CardTitle>
            </CardHeader>
             {/* --- END MODIFIED CARD HEADER 1 --- */}
            <CardContent className="pt-4">
              <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2">
                {filteredAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all hover-list-item ${ selectedAnalysis === analysis.id ? 'active bg-primary/10' : '' }`}
                    onClick={() => handleSelectAnalysis(analysis.id)}
                  >
                    <div className="font-medium">{analysis.task_name}</div>
                    <div className="text-xs mt-1 flex items-center text-muted-foreground"> <Calendar className="h-3 w-3 mr-1" /> {new Date(analysis.created_at).toLocaleDateString()} · <Clock className="h-3 w-3 mx-1" /> {new Date(analysis.created_at).toLocaleTimeString()} </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Details Card */}
          <Card className="col-span-1 lg:col-span-2 border shadow-sm rounded-xl overflow-hidden hover-card transition-all">
             {/* --- MODIFIED CARD HEADER 2 --- */}
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-primary-foreground rounded-t-xl pb-4">
              <CardTitle className="flex items-center text-primary-foreground"> {/* Ensure text color */}
                {selectedAnalysisData ? (
                  <>
                    <Bone className="h-5 w-5 mr-2" /> {/* Icon color inherits */}
                    {selectedAnalysisData.task_name}
                  </>
                ) : (
                  'Analysis Details'
                )}
              </CardTitle>
            </CardHeader>
            {/* --- END MODIFIED CARD HEADER 2 --- */}
            <CardContent className={`pt-4 ${contentFadeIn ? 'fade-in-content visible' : 'fade-in-content'}`}>
              {selectedAnalysisData ? (
                <Tabs defaultValue="results" className="w-full">
                  <TabsList className="mb-4 w-full bg-muted/50"> <TabsTrigger value="results" className="hover-tab-trigger transition-colors data-[state=active]:bg-primary/10"> Analysis Results </TabsTrigger> <TabsTrigger value="chat" className="hover-tab-trigger transition-colors data-[state=active]:bg-primary/10"> Chat History </TabsTrigger> </TabsList>
                  <TabsContent value="results" className="space-y-4"> {/* Results Content */} </TabsContent>
                  <TabsContent value="chat"> {/* Chat History Content */} </TabsContent>
                </Tabs>
              ) : (
                <div className="flex justify-center items-center h-64 text-muted-foreground"> Select an analysis to view details </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Share Dialog remains the same */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}> {/* Share Dialog Content */} </Dialog>
    </div>
  );
};

export default AnalysisHistory;
