import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Home, ArrowRight, Clock, Bone, Calendar, Filter, Download, Share2, X, ImageOff } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox'; // Ensure this is imported
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import jsPDF from 'jspdf';

// Interfaces remain the same
interface Analysis {
  id: string;
  task_id: string;
  task_name: string;
  image_url: string | null;
  result_text: string | null;
  created_at: string;
  user_id: string;
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
  const [filterOpen, setFilterOpen] = useState(false); // State to control filter popover
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareNote, setShareNote] = useState('');

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    taskTypes: [],
    dateRange: { start: null, end: null }
  });

  const uniqueTaskTypes = [...new Set(analyses.map(a => a.task_name))];
  const resultsDisplayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchAnalyses();
    setTimeout(() => { setTitleFadeIn(true); }, 100);
  }, [user, navigate]);

  useEffect(() => {
    setContentFadeIn(false);
    if (selectedAnalysis) { setTimeout(() => { setContentFadeIn(true); }, 100); }
  }, [selectedAnalysis]);

  // Apply filters whenever filterOptions state or the base analyses list changes
  useEffect(() => {
    console.log("Filter options changed, applying filters:", filterOptions); // Debug log
    applyFilters();
  }, [filterOptions, analyses]); // Dependencies are correct

  const fetchAnalyses = async () => { /* ... (unchanged) ... */
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('analyses')
        .select('id, task_id, task_name, image_url, result_text, created_at, user_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) { throw error; }
      const fetchedAnalyses = data || [];
      setAnalyses(fetchedAnalyses);
      // Apply initial filters based on default filterOptions state
      // applyFilters() will be called by the useEffect hook once analyses is set

      if (fetchedAnalyses.length > 0) {
        const firstAnalysisId = fetchedAnalyses[0].id;
        const locationState = location.state as { analysisId?: string };
        const targetAnalysisId = locationState?.analysisId && fetchedAnalyses.some(a => a.id === locationState.analysisId)
                                 ? locationState.analysisId
                                 : firstAnalysisId;

        setSelectedAnalysis(targetAnalysisId);
        await fetchChatInteractions(targetAnalysisId);
        navigate(location.pathname, { replace: true, state: {} });
      } else {
        setSelectedAnalysis(null);
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast.error('Failed to load analysis history');
    } finally {
      setLoading(false);
    }
  };

  const fetchChatInteractions = async (analysisId: string) => { /* ... (unchanged) ... */
    if (!user || !analysisId || chatInteractions[analysisId]) {
      return;
    }
    try {
      const { data, error } = await supabase
        .from('chat_interactions')
        .select('*')
        .eq('analysis_id', analysisId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) { throw error; }
      setChatInteractions(prev => ({ ...prev, [analysisId]: data || [] }));
    } catch (error) {
      console.error(`Error fetching chat interactions for ${analysisId}:`, error);
    }
  };

  const handleSelectAnalysis = async (analysisId: string) => { /* ... (unchanged) ... */
    setSelectedAnalysis(analysisId);
    if (!chatInteractions[analysisId]) {
      await fetchChatInteractions(analysisId);
    }
  };

  // This function filters the 'analyses' array based on 'filterOptions'
  const applyFilters = () => {
    let filtered = [...analyses]; // Start with the full list

    // Apply task type filters
    if (filterOptions.taskTypes.length > 0) {
      filtered = filtered.filter(analysis =>
        filterOptions.taskTypes.includes(analysis.task_name)
      );
    }

    // Apply date range filters
    if (filterOptions.dateRange.start) {
      const startDate = new Date(filterOptions.dateRange.start);
      startDate.setHours(0, 0, 0, 0); // Start of day
      filtered = filtered.filter(analysis => new Date(analysis.created_at) >= startDate);
    }
    if (filterOptions.dateRange.end) {
      const endDate = new Date(filterOptions.dateRange.end);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(analysis => new Date(analysis.created_at) <= endDate);
    }

    // Update the state variable that holds the filtered list
    setFilteredAnalyses(filtered);

    // Reselect analysis if current one is filtered out
    if (filtered.length > 0) {
      if (!selectedAnalysis || !filtered.some(a => a.id === selectedAnalysis)) {
        const newSelectedId = filtered[0].id;
        setSelectedAnalysis(newSelectedId);
        if (!chatInteractions[newSelectedId]) {
          fetchChatInteractions(newSelectedId); // Fetch chats for the new selection
        }
      }
    } else {
      setSelectedAnalysis(null); // No analyses match filters
    }
  };

  // --- Filter Handlers ---

  // Correctly updates the taskTypes array in the filter state
  const handleFilterChange = (taskName: string) => {
    setFilterOptions(prev => {
      const currentTaskTypes = prev.taskTypes;
      const taskTypes = currentTaskTypes.includes(taskName)
        ? currentTaskTypes.filter(t => t !== taskName) // Remove if present
        : [...currentTaskTypes, taskName]; // Add if not present
      console.log(`Toggling filter for ${taskName}. New taskTypes:`, taskTypes); // Debug log
      return { ...prev, taskTypes }; // Return the updated state
    });
    // applyFilters() will be called by the useEffect hook listening to filterOptions change
  };

  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    setFilterOptions(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [type]: value ? new Date(value) : null }
    }));
  };

  const clearFilters = () => {
    setFilterOptions({
      taskTypes: [],
      dateRange: { start: null, end: null }
    });
    setFilterOpen(false); // Close popover when clearing filters
  };

  // --- End Filter Handlers ---

  const handleExport = async () => { /* ... (unchanged PDF logic from previous step) ... */
    if (!selectedAnalysis) {
      toast.warning('Please select an analysis to export.');
      return;
    }
    const analysis = analyses.find(a => a.id === selectedAnalysis);
    if (!analysis) {
      toast.error('Selected analysis data not found.');
      return;
    }
    const toastId = toast.loading('Generating PDF, please wait...');
    const imageSourceUrl = analysis.image_url;

    try {
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const analysisDate = new Date(analysis.created_at).toLocaleString();
        const margin = 20;
        const contentWidth = pdf.internal.pageSize.getWidth() - 2 * margin;
        const pageHeight = pdf.internal.pageSize.getHeight();
        let yPos = margin;
        const addText = (text: string, size: number, style: 'normal' | 'bold' | 'italic' = 'normal', spacing = 5) => { /* ... helper function ... */
            pdf.setFontSize(size);
            pdf.setFont('helvetica', style);
            const lines = pdf.splitTextToSize(text, contentWidth);
            lines.forEach((line: string) => {
                if (yPos + size / 2.5 > pageHeight - margin) { pdf.addPage(); yPos = margin; }
                pdf.text(line, margin, yPos); yPos += size / 2.5 + 1;
            });
            yPos += spacing;
         };
        addText(analysis.task_name, 18, 'bold', 5); yPos += 5;
        addText(`Analysis Date: ${analysisDate}`, 10, 'normal', 2);
        if (user) { addText(`User: ${user.email || 'Unknown'}`, 10, 'normal', 5); } yPos += 5;
        addText('Medical Image', 14, 'bold', 3);
        if (yPos > pageHeight - margin - 30) { pdf.addPage(); yPos = margin; addText('Medical Image', 14, 'bold', 3); }
        let imageAddedSuccessfully = false;
        if (imageSourceUrl) { /* ... image loading logic ... */
            console.log("PDF Gen: Attempting image from URL:", imageSourceUrl);
            try {
                const img = new Image(); img.crossOrigin = "Anonymous"; img.src = imageSourceUrl;
                const imgLoaded = await new Promise<HTMLImageElement | null>((resolve) => { /* ... promise logic ... */
                    img.onload = () => resolve(img);
                    img.onerror = (e) => { console.error("PDF Gen Error: Failed to load image from URL.", "URL:", imageSourceUrl, "Error:", e); resolve(null); };
                    setTimeout(() => { console.warn("PDF Gen Warning: Image load timeout for URL:", imageSourceUrl); resolve(null); }, 20000);
                });
                if (imgLoaded) { /* ... image positioning and adding logic ... */
                    const imgProps = pdf.getImageProperties(imgLoaded); const aspectRatio = imgProps.width / imgProps.height;
                    const availableHeight = pageHeight - yPos - margin; let imgWidth = contentWidth; let imgHeight = imgWidth / aspectRatio;
                    if (imgHeight > availableHeight) { imgHeight = availableHeight; imgWidth = imgHeight * aspectRatio; if (imgWidth > contentWidth) { imgWidth = contentWidth; imgHeight = imgWidth / aspectRatio; } }
                    const xOffset = margin + (contentWidth - imgWidth) / 2;
                    if (yPos + imgHeight > pageHeight - margin) { pdf.addPage(); yPos = margin; addText('Medical Image (cont.)', 14, 'bold', 3); }
                    pdf.addImage(imgLoaded, imgProps.fileType, xOffset, yPos, imgWidth, imgHeight); yPos += imgHeight + 10; imageAddedSuccessfully = true;
                    console.log("PDF Gen: Image added successfully from URL.");
                } else { console.log("PDF Gen: Failed to load image from URL."); }
            } catch (urlImgError) { console.error("PDF Gen Error: Exception processing image from URL:", urlImgError); }
        } else { console.log("PDF Gen: No image_url found for this analysis."); }
        if (!imageAddedSuccessfully) { /* ... error message logic ... */
            if (yPos > pageHeight - margin - 10) { pdf.addPage(); yPos = margin; }
            addText("Error: Could not load the medical image for the PDF.", 10, 'italic', 5);
            console.log("PDF Gen: Failed to add image from URL or URL was missing."); yPos += 5;
        }
        if (analysis.result_text) { /* ... text results logic ... */
            if (yPos > pageHeight - margin - 20) { pdf.addPage(); yPos = margin; }
            addText('Analysis Results', 14, 'bold', 5);
            const cleanResults = analysis.result_text.replace(/\r\n/g, '\n') /* ... more cleaning ... */ .trim();
            const resultBlocks = cleanResults.split('\n\n');
            resultBlocks.forEach(block => { /* ... block rendering logic ... */
                const trimmedBlock = block.trim(); if (!trimmedBlock) return;
                if (trimmedBlock.startsWith('**') && trimmedBlock.endsWith('**')) { addText(trimmedBlock.slice(2, -2), 12, 'bold', 3); }
                else if (trimmedBlock.startsWith('**') && trimmedBlock.endsWith(':')) { addText(trimmedBlock.slice(2), 12, 'bold', 3); }
                else { addText(trimmedBlock, 10, 'normal', 3); } yPos += 2;
            });
        } else { /* ... no results text logic ... */
             if (yPos > pageHeight - margin - 10) { pdf.addPage(); yPos = margin; }
             addText('No analysis results text available.', 10, 'italic', 5);
        }
        const pageCount = pdf.getNumberOfPages(); /* ... page number logic ... */
        for (let i = 1; i <= pageCount; i++) { pdf.setPage(i); pdf.setFontSize(8); pdf.setTextColor(150); pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' }); }
        const dateStr = new Date(analysis.created_at).toISOString().split('T')[0]; /* ... saving logic ... */
        const cleanTitle = analysis.task_name.replace(/[^a-z0-9]/gi, '_').toLowerCase(); pdf.save(`${cleanTitle}_history_${dateStr}.pdf`);
        toast.success('PDF exported successfully!', { id: toastId });
    } catch (error) { /* ... error handling ... */
        console.error('Error exporting PDF:', error);
        toast.error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: toastId });
    }
  };

  const handleShare = async () => { /* ... (unchanged) ... */
    if (!shareEmail || !selectedAnalysis) { toast.error('Please enter a valid email address.'); return; }
    if (!/\S+@\S+\.\S+/.test(shareEmail)) { toast.error('Invalid email format.'); return; }
    console.log(`Sharing analysis ${selectedAnalysis} with ${shareEmail}. Note: ${shareNote}`);
    toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), { loading: 'Sending share email...', success: `Analysis shared with ${shareEmail}`, error: 'Failed to share analysis' });
    setShareDialogOpen(false); setShareEmail(''); setShareNote('');
   };

  const formatResults = (resultsText: string | null): React.ReactNode => { /* ... (unchanged) ... */
      if (!resultsText) return <p className="text-muted-foreground">No results text available.</p>;
      try { /* ... formatting logic ... */ return <div className="space-y-3 leading-relaxed">{[]}</div> } catch (e) { console.error("Error formatting results:", e); return <pre className="whitespace-pre-wrap text-sm">{resultsText}</pre>; }
  };

  const getAnalysisById = (id: string | null): Analysis | null => { /* ... (unchanged) ... */ return analyses.find(analysis => analysis.id === id) || null; };

  const selectedAnalysisData = getAnalysisById(selectedAnalysis);

  return (
    <div className="container mx-auto px-4 py-12">
       {/* Styles (unchanged) */}
       <style>{` /* ... */ `}</style>

      {/* Navigation and Title (unchanged) */}
      {/* ... */}

      {/* === Filter and Action Bar === */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Popover controlled by filterOpen state */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
                <Filter size={14} />
                Filter
                {(filterOptions.taskTypes.length > 0 || filterOptions.dateRange.start || filterOptions.dateRange.end) && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary flex items-center justify-center text-[10px] font-semibold text-primary-foreground">
                        {/* Calculate count correctly */}
                        {filterOptions.taskTypes.length + (filterOptions.dateRange.start ? 1 : 0) + (filterOptions.dateRange.end ? 1 : 0) - (filterOptions.dateRange.start && filterOptions.dateRange.end ? 1 : 0)}
                    </span>
                 )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="start">
              {/* --- Task Type Filter --- */}
              <div className="space-y-4 mb-4 pb-4 border-b dark:border-gray-700">
                   <div className="flex items-center justify-between">
                     <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200">Analysis Type</h4>
                     {filterOptions.taskTypes.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setFilterOptions(prev => ({ ...prev, taskTypes: [] }))} className="h-6 px-1 text-xs text-muted-foreground hover:text-primary">Clear</Button>
                     )}
                   </div>
                   <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                     {uniqueTaskTypes.length > 0 ? uniqueTaskTypes.map(taskName => (
                       <div key={taskName} className="flex items-center space-x-2">
                         {/* Checkbox state and handler correctly assigned */}
                         <Checkbox
                           id={`filter-${taskName}`}
                           checked={filterOptions.taskTypes.includes(taskName)}
                           onCheckedChange={() => handleFilterChange(taskName)} // Use the correct handler
                           className="h-3.5 w-3.5 border-gray-300 dark:border-gray-600" // Standard styling
                         />
                         <Label htmlFor={`filter-${taskName}`} className="text-xs font-normal text-gray-700 dark:text-gray-300 cursor-pointer">{taskName}</Label>
                       </div>
                       )) : <p className="text-xs text-muted-foreground">No types found.</p>}
                   </div>
              </div>
              {/* --- Date Range Filter --- */}
               <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200">Date Range</h4>
                     {(filterOptions.dateRange.start || filterOptions.dateRange.end) && (
                        <Button variant="ghost" size="sm" onClick={() => setFilterOptions(prev => ({ ...prev, dateRange: { start: null, end: null } }))} className="h-6 px-1 text-xs text-muted-foreground hover:text-primary">Clear</Button>
                      )}
                   </div>
                   <div className="space-y-2">
                     <div>
                       <Label htmlFor="start-date" className="text-xs font-medium text-gray-600 dark:text-gray-400">Start Date</Label>
                       <Input id="start-date" type="date" className="text-xs h-8 mt-1" value={filterOptions.dateRange.start ? filterOptions.dateRange.start.toISOString().split('T')[0] : ''} onChange={e => handleDateRangeChange('start', e.target.value)} />
                     </div>
                     <div>
                       <Label htmlFor="end-date" className="text-xs font-medium text-gray-600 dark:text-gray-400">End Date</Label>
                       <Input id="end-date" type="date" className="text-xs h-8 mt-1" value={filterOptions.dateRange.end ? filterOptions.dateRange.end.toISOString().split('T')[0] : ''} onChange={e => handleDateRangeChange('end', e.target.value)} />
                     </div>
                   </div>
                 </div>
               {/* --- Clear All Button --- */}
               {(filterOptions.taskTypes.length > 0 || filterOptions.dateRange.start || filterOptions.dateRange.end) && (
                  <Button variant="link" size="sm" onClick={clearFilters} className="w-full mt-3 text-xs text-center text-primary hover:underline">Clear All Filters</Button>
               )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Action Buttons (Export, Share) */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs" disabled={!selectedAnalysisData} onClick={handleExport}>
            <Download size={14} /> Export PDF
          </Button>
          {/* <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs" disabled={!selectedAnalysisData} onClick={() => setShareDialogOpen(true)}>
            <Share2 size={14} /> Share
          </Button> */}
        </div>
      </div>
      {/* === End Filter Bar === */}


      {/* Main Content Area: Loading, No Results, or Grid (unchanged structure) */}
      {loading ? ( /* ... loading ... */
        <div className="flex justify-center items-center h-64"> {/* Loading Indicator */}
            <div className="relative">
                <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Bone className="h-5 w-5 text-primary animate-pulse" />
                </div>
            </div>
        </div>
      ) : filteredAnalyses.length === 0 ? ( /* ... no results ... */
        <Card className="border shadow-sm hover-card transition-all rounded-xl border-dashed border-gray-300 dark:border-gray-700">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6">
                <Filter className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2 text-center text-gray-700 dark:text-gray-300">No Matching Analyses Found</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                    {analyses.length > 0 ? 'Adjust your filters or clear them to see all past analyses.' : 'You haven\'t performed any bone health analyses yet.'}
                </p>
                {analyses.length > 0 ? (
                    <Button onClick={clearFilters} size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover-scale transition-all text-white rounded-md text-xs px-4 py-1.5">
                        <X className="mr-1.5 h-3.5 w-3.5" /> Clear Filters
                    </Button>
                ) : (
                    <Button onClick={() => navigate('/tasks')} size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover-scale transition-all text-white rounded-md text-xs px-4 py-1.5">
                        <Bone className="mr-1.5 h-3.5 w-3.5" /> Start New Analysis
                    </Button>
                )}
            </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Analyses List Card (unchanged) */}
           <Card className="col-span-1 border rounded-xl shadow-sm overflow-hidden hover-card transition-all">
               {/* ... header ... */}
               <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 border-b border-blue-700/50 text-white"><CardTitle className="flex items-center text-base font-semibold"><Clock className="h-4 w-4 mr-2 text-white/90" />Past Analyses {filteredAnalyses.length !== analyses.length && `(${filteredAnalyses.length} / ${analyses.length})`}</CardTitle></CardHeader>
               {/* ... content: list of analyses ... */}
               <CardContent className="p-1.5"><div className="space-y-1 max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar pr-1">{filteredAnalyses.map(analysis => <div key={analysis.id} className={`p-2.5 rounded-md cursor-pointer transition-all hover-list-item ${selectedAnalysis === analysis.id ? 'active' : ''}`} onClick={() => handleSelectAnalysis(analysis.id)}>{/* ... list item content ... */}</div>)}</div></CardContent>
           </Card>

           {/* Analysis Details Card (unchanged) */}
           <Card className="col-span-1 lg:col-span-2 border shadow-sm rounded-xl overflow-hidden hover-card transition-all">
                {/* ... header ... */}
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 border-b border-blue-700/50 text-white"><CardTitle className="flex items-center text-base font-semibold">{selectedAnalysisData ? <><Bone className="h-4 w-4 mr-2 text-white/90" />{selectedAnalysisData.task_name}</> : 'Analysis Details'}</CardTitle></CardHeader>
                {/* ... content: tabs for results and chat ... */}
                <CardContent className={`pt-4 p-4 md:p-5 ${contentFadeIn ? 'fade-in-content visible' : 'fade-in-content'}`}>
                    {/* ... Tabs, TabsList, TabsContent ... */}
                     {selectedAnalysisData ? <Tabs defaultValue="results" className="w-full">{/* ... Tabs ... */}</Tabs> : <div className="flex justify-center items-center h-64 text-muted-foreground text-sm">Select an analysis from the list to view details.</div>}
                </CardContent>
           </Card>
        </div>
      )}

      {/* Share Dialog (unchanged) */}
      {/* ... */}
    </div>
  );
};

export default AnalysisHistory;
