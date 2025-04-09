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
    } else if (filtered.length === 0) {
      setSelectedAnalysis(null); // Clear selection if no items match filter
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
    // Reset filtered analyses to all analyses
    setFilteredAnalyses(analyses);
    // Reselect the first analysis if available
    if (analyses.length > 0) {
      setSelectedAnalysis(analyses[0].id);
    } else {
      setSelectedAnalysis(null);
    }
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

      // Add results content (rendered from canvas)
      const contentElement = resultsRef.current;
      const pdfWidth = pdf.internal.pageSize.getWidth() - 40; // A4 width in mm minus margins
      
      // Render the HTML content using html2canvas
      const canvasContent = await html2canvas(contentElement, { 
        scale: 2, // Higher scale for better quality
        useCORS: true // If images are external
      });
      const imgDataContent = canvasContent.toDataURL('image/png');
      const imgPropsContent = pdf.getImageProperties(imgDataContent);
      const pdfImageHeightContent = (imgPropsContent.height * pdfWidth) / imgPropsContent.width;
      
      let heightLeft = pdfImageHeightContent;
      let position = 40; // Starting position below header/divider

      // Check if content fits on the first page
      if (position + heightLeft < pdf.internal.pageSize.getHeight() - 20) { // Check against page height minus bottom margin
           pdf.addImage(imgDataContent, 'PNG', 20, position, pdfWidth, heightLeft);
      } else {
          // Add content page by page if it doesn't fit
           pdf.addImage(imgDataContent, 'PNG', 20, position, pdfWidth, heightLeft);
           heightLeft -= (pdf.internal.pageSize.getHeight() - position - 20); // Subtract height of first part, consider margins
           while (heightLeft > 0) {
              position = -heightLeft; // Negative position relative to top of image
              pdf.addPage();
              pdf.addImage(imgDataContent, 'PNG', 20, 20, pdfWidth, pdfImageHeightContent, undefined, 'FAST'); // Add the whole image again, adjust y-position logic if needed for partial rendering
              // Simpler approach for multi-page content might be needed depending on html2canvas/jspdf capabilities or splitting content before canvas rendering
              // For now, this adds subsequent pages with the image potentially starting higher. A more robust solution might involve splitting the canvas or DOM before rendering.
              heightLeft -= (pdf.internal.pageSize.getHeight() - 20 - 20); // Subtract height of subsequent pages (top/bottom margin)
          }
      }

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
  const formatResults = (resultsText: string | null) => {
    if (!resultsText) return null;

    // Remove code blocks
    const textWithoutCodeBlocks = resultsText.replace(/```[\s\S]*?```/g, '');

    const paragraphs = textWithoutCodeBlocks.split(/\n\n+/);
    return (
      <div className="space-y-4 leading-relaxed">
        {paragraphs.map((para, index) => {
          // Improved heading detection (handles various markdown levels and common titles)
          const headingMatch = para.match(/^(#{1,4}\s+)?(Summary|Findings|Interpretation|Recommendations|Assessment|Diagnosis|Conclusion|Analysis Results)\s*[:\-*]?\s*(.*)/i);
          if (headingMatch) {
             // Use the captured group after the title word, or the word itself if nothing follows
            const headingText = (headingMatch[3] || headingMatch[2]).trim();
            // Basic styling based on heading level or default if no # used
            const HeadingTag = `h${Math.min((headingMatch[1]?.match(/#/g)?.length || 0) + 2, 4)}` as keyof JSX.IntrinsicElements; // h2, h3, h4
            return <HeadingTag key={index} className="text-lg font-semibold mt-5 first:mt-0 text-primary/90 border-b pb-1 mb-2">{headingText}</HeadingTag>;
          }

          // Improved list item detection (handles *, -, •) and potential bolding within items
           if (para.trim().match(/^([*\-•]\s+)/)) {
              // Split based on list markers, preserving indentation/content
              const listItems = para.split(/\n(?=[*\-•]\s+)/).map(item => item.trim().replace(/^[*\-•]\s+/, ''));
              return (
                  <ul key={index} className="list-disc pl-6 space-y-1.5 mt-2">
                      {listItems.filter(Boolean).map((item, i) => (
                          <li key={i} className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: item.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') }} />
                      ))}
                  </ul>
              );
          }


          // Handle bold text within paragraphs
          return <p key={index} className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: para.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') }} />;
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
        :root {
            --primary-rgb: 83, 109, 254; /* Example: Indigo-500 */
            --primary: #536dfe; /* Example: Indigo-500 */
        }
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
          padding-left: 12px; /* Increased padding on hover */
          transform: translateX(2px); /* Slight move right */
        }

        .hover-list-item.active {
          border-left-color: var(--primary);
          background-color: rgba(var(--primary-rgb), 0.1);
          padding-left: 12px; /* Consistent padding */
          font-weight: 500; /* Medium weight for active item */
        }

        .hover-tab-trigger {
          transition: background-color 0.2s ease-out, color 0.2s ease-out;
        }

        /* Style for Shadcn TabsTrigger with hover */
        [data-state=inactive].hover-tab-trigger:hover {
             background-color: rgba(var(--primary-rgb), 0.08);
             color: var(--primary);
        }
         /* Ensure active tab has the right style */
        [data-state=active].hover-tab-trigger {
             background-color: rgba(var(--primary-rgb), 0.1);
             color: var(--primary);
             font-weight: 500;
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
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(var(--primary-rgb), 0.05);
            border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(var(--primary-rgb), 0.3);
            border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(var(--primary-rgb), 0.5);
        }
        /* Prose adjustments for dark mode */
        .dark .prose-invert {
             --tw-prose-body: #d1d5db; /* gray-300 */
             --tw-prose-headings: #f9fafb; /* gray-50 */
             --tw-prose-lead: #e5e7eb; /* gray-200 */
             --tw-prose-links: #93c5fd; /* blue-300 */
             --tw-prose-bold: #f9fafb; /* gray-50 */
             --tw-prose-counters: #9ca3af; /* gray-400 */
             --tw-prose-bullets: #6b7280; /* gray-500 */
             --tw-prose-hr: #4b5563; /* gray-600 */
             --tw-prose-quotes: #d1d5db; /* gray-300 */
             --tw-prose-quote-borders: #4b5563; /* gray-600 */
             --tw-prose-captions: #9ca3af; /* gray-400 */
             --tw-prose-code: #f3f4f6; /* gray-100 */
             --tw-prose-pre-code: #e5e7eb; /* gray-200 */
             --tw-prose-pre-bg: #1f2937; /* gray-800 */
             --tw-prose-th-borders: #4b5563; /* gray-600 */
             --tw-prose-td-borders: #374151; /* gray-700 */
        }
        .prose strong, .prose b { /* Ensure bold is distinctly visible */
           color: inherit; /* Inherit color from parent */
           font-weight: 600; /* Semibold */
        }
        .dark .prose-invert strong, .dark .prose-invert b {
           color: var(--tw-prose-bold);
        }

        `}
      </style>
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline" // Changed variant for better contrast potentially
          onClick={() => navigate('/tasks')}
          className="hover-scale group transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl border-muted-foreground/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground" // Added group for icon animation
        >
          <svg
            className="mr-1 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" // Adjusted margin
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Button>

        <Button
          variant="outline" // Changed variant
          onClick={() => navigate('/')}
           className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl border-muted-foreground/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          <Home className="mr-2 h-4 w-4" />
          Home
        </Button>
      </div>

      <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-6 rounded-2xl mb-8 shadow-inner-soft">
        <h1 className={`text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100 ${titleFadeIn ? 'fade-in-title visible' : 'fade-in-title'}`}>Analysis History</h1>
        <p className="text-muted-foreground">
          View your past bone health analyses and chatbot interactions
        </p>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-6 gap-4"> {/* Added flex-wrap and gap */}
        <div className="flex items-center gap-2 flex-wrap"> {/* Added flex-wrap */}
          {/* Filter Popover */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Filter size={16} />
                <span>Type</span>
                {(filterOptions.taskTypes.length > 0 || filterOptions.dateRange.start || filterOptions.dateRange.end) && ( // Combined condition
                  <span className="ml-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-bold">
                    {filterOptions.taskTypes.length + (filterOptions.dateRange.start || filterOptions.dateRange.end ? 1 : 0)} {/* Show count */}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              {/* Task Type Filters */}
              <div className="space-y-4 mb-4 pb-4 border-b">
                 <div className="flex items-center justify-between">
                   <h4 className="font-medium text-sm">Analysis Type</h4>
                   {filterOptions.taskTypes.length > 0 && (
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => setFilterOptions(prev => ({ ...prev, taskTypes: [] }))}
                       className="h-7 px-1.5 text-xs"
                     >
                       Clear types
                     </Button>
                   )}
                 </div>
                 <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                   {uniqueTaskTypes.map(taskName => (
                     <div key={taskName} className="flex items-center space-x-2">
                       <Checkbox
                         id={`filter-${taskName}`}
                         checked={filterOptions.taskTypes.includes(taskName)}
                         onCheckedChange={() => handleFilterChange(taskName)}
                       />
                       <Label htmlFor={`filter-${taskName}`} className="text-sm font-normal">{taskName}</Label>
                     </div>
                   ))}
                 </div>
              </div>
              {/* Date Range Filters */}
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <h4 className="font-medium text-sm">Date Range</h4>
                   {(filterOptions.dateRange.start || filterOptions.dateRange.end) && (
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => setFilterOptions(prev => ({ ...prev, dateRange: { start: null, end: null } }))}
                       className="h-7 px-1.5 text-xs"
                     >
                       Clear dates
                     </Button>
                   )}
                 </div>
                 <div className="space-y-2">
                   <div className="grid grid-cols-1 gap-2"> {/* Changed to 1 col for better mobile */}
                     <div>
                       <Label htmlFor="start-date" className="text-xs">Start Date</Label>
                       <Input
                         id="start-date"
                         type="date"
                         className="text-sm h-9"
                         value={filterOptions.dateRange.start ? filterOptions.dateRange.start.toISOString().split('T')[0] : ''}
                         onChange={(e) => handleDateRangeChange('start', e.target.value)}
                       />
                     </div>
                     <div>
                       <Label htmlFor="end-date" className="text-xs">End Date</Label>
                       <Input
                         id="end-date"
                         type="date"
                         className="text-sm h-9"
                         value={filterOptions.dateRange.end ? filterOptions.dateRange.end.toISOString().split('T')[0] : ''}
                         onChange={(e) => handleDateRangeChange('end', e.target.value)}
                       />
                     </div>
                   </div>
                 </div>
               </div>
              {/* Global Clear Button */}
               {(filterOptions.taskTypes.length > 0 || filterOptions.dateRange.start || filterOptions.dateRange.end) && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full mt-4 text-xs text-center"
                  >
                    Clear All Filters
                  </Button>
                )}
            </PopoverContent>
          </Popover>

        </div>
        <div className="flex items-center gap-2 flex-wrap"> {/* Added flex-wrap */}
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={!selectedAnalysisData}
            onClick={handleExport}
          >
            <Download size={16} />
            <span>Export PDF</span>
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
        <Card className="border shadow-sm hover-card transition-all rounded-xl"> {/* Ensure rounded */}
          <CardContent className="flex flex-col items-center justify-center py-12 px-6"> {/* Added padding */}
            <Filter className="h-16 w-16 text-muted-foreground/50 mb-4" /> {/* Changed Icon */}
            <h3 className="text-xl font-medium mb-2 text-center">No Matching Analyses Found</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              {analyses.length > 0 ?
                'Adjust your filters or clear them to see all past analyses.' :
                'You haven\'t performed any bone health analyses yet.'}
            </p>
            {analyses.length > 0 ? (
              <Button
                onClick={clearFilters}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover-scale transition-all text-white rounded-lg" // Ensure text is white
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/tasks')} // Navigate to tasks page instead of specific analysis
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover-scale transition-all text-white rounded-lg" // Ensure text is white
              >
                <Bone className="mr-2 h-4 w-4" />
                Start New Analysis
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Past Analyses List Card */}
          <Card className="col-span-1 border rounded-xl shadow-sm overflow-hidden hover-card transition-all bg-white dark:bg-gray-850"> {/* Added bg */}
             <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4 border-b dark:border-gray-700"> {/* Adjusted padding */}
              <CardTitle className="flex items-center text-base font-semibold text-gray-700 dark:text-gray-200"> {/* Adjusted text size/color */}
                <Clock className="h-4 w-4 mr-2 text-primary" />
                Past Analyses {filteredAnalyses.length !== analyses.length && `(${filteredAnalyses.length} / ${analyses.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2"> {/* Adjusted padding */}
              <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto pr-1 custom-scrollbar"> {/* Adjusted max-h and added scrollbar class */}
                {filteredAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className={`p-3 rounded-md cursor-pointer transition-all hover-list-item ${ // rounded-md instead of lg
                      selectedAnalysis === analysis.id ? 'active' : '' // Simplified active class logic
                    }`}
                    onClick={() => handleSelectAnalysis(analysis.id)}
                  >
                    <div className={`font-medium text-sm truncate ${selectedAnalysis === analysis.id ? 'text-primary' : 'text-gray-800 dark:text-gray-100'}`}> {/* Truncate long names */}
                      {analysis.task_name}
                    </div>
                    <div className="text-xs mt-1 flex items-center text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(analysis.created_at).toLocaleDateString()} ·
                      <Clock className="h-3 w-3 ml-1.5 mr-1" /> {/* Adjusted spacing */}
                      {new Date(analysis.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {/* Simplified time */}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Details Card */}
          <Card className="col-span-1 lg:col-span-2 border shadow-sm rounded-xl overflow-hidden hover-card transition-all bg-white dark:bg-gray-850"> {/* Added bg */}
             <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4 border-b dark:border-gray-700"> {/* Adjusted padding */}
              <CardTitle className="flex items-center text-base font-semibold text-gray-700 dark:text-gray-200"> {/* Adjusted text size/color */}
                {selectedAnalysisData ? (
                  <>
                    <Bone className="h-4 w-4 mr-2 text-primary" />
                    {selectedAnalysisData.task_name}
                  </>
                ) : (
                  'Analysis Details'
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className={`pt-4 p-4 md:p-6 ${contentFadeIn ? 'fade-in-content visible' : 'fade-in-content'}`}> {/* Added padding */}
              {selectedAnalysisData ? (
                <Tabs defaultValue="results" className="w-full">
                  <TabsList className="mb-4 grid w-full grid-cols-2 bg-muted/50 rounded-lg p-1"> {/* Grid layout for tabs */}
                    <TabsTrigger
                      value="results"
                      className="hover-tab-trigger data-[state=active]:shadow-sm" // Added active shadow
                    >
                      Analysis Results
                    </TabsTrigger>
                    <TabsTrigger
                      value="chat"
                      className="hover-tab-trigger data-[state=active]:shadow-sm" // Added active shadow
                    >
                      Chat History
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="results" className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar pr-2"> {/* Added max-h and scrollbar */}
                     {selectedAnalysisData.image_url && (
                      <div className="mb-6 border rounded-lg p-3 hover-image-card transition-all overflow-hidden bg-gray-50 dark:bg-gray-800">
                        <h3 className="font-medium text-sm mb-2 flex items-center text-gray-700 dark:text-gray-300">
                          <svg
                            className="h-4 w-4 mr-2 text-primary/80"
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
                            className="max-h-60 md:max-h-72 object-contain rounded-md cursor-pointer transition-transform hover:scale-[1.02]" // Adjusted max-h
                             onClick={() => window.open(selectedAnalysisData.image_url, '_blank')} // Open image in new tab
                          />
                        </div>
                      </div>
                    )}
                    {selectedAnalysisData.result_text ? (
                      // Added ref here for PDF export
                      <div ref={resultsRef} className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                        {formatResults(selectedAnalysisData.result_text)}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-6">No analysis results available for this entry.</p> // Centered message
                    )}

                  </TabsContent>

                  <TabsContent value="chat" className="max-h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar pr-2"> {/* Added max-h and scrollbar */}
                    {chatInteractions[selectedAnalysisData.id]?.length > 0 ? (
                      <div className="space-y-4">
                        {chatInteractions[selectedAnalysisData.id].map((chat, index) => (
                          <div key={chat.id || index} className="space-y-2"> {/* Fallback key */}
                            <div className="flex justify-end group">
                              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-lg rounded-tr-none max-w-[85%] text-sm hover-message transition-all shadow-md">
                                {chat.user_message}
                                 <div className="text-xs text-blue-200 opacity-0 group-hover:opacity-100 transition-opacity mt-1 text-right">
                                   {new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </div>
                              </div>
                            </div>
                            <div className="flex justify-start group">
                              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg rounded-tl-none max-w-[85%] text-sm hover-ai-message transition-all shadow-md text-gray-800 dark:text-gray-100">
                                {chat.ai_response}
                                 <div className="text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1 text-left">
                                    {new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                          <svg
                            className="h-8 w-8 text-gray-400 dark:text-gray-500"
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
                        <p className="text-muted-foreground mb-4">No chat interactions recorded for this analysis.</p> {/* Added margin */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 hover-scale transition-all"
                          onClick={() => navigate(`/analysis/${selectedAnalysisData.task_id}?analysisId=${selectedAnalysisData.id}`)} // Pass analysisId too if needed
                        >
                          Discuss Results
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex justify-center items-center h-64 text-muted-foreground">
                  Select an analysis from the list to view details
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
             {/* Optional: Add description */}
             {/* <DialogDescription>Enter the recipient's email and an optional note.</DialogDescription> */}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-right">Email address</Label> {/* Added class for potential alignment */}
              <Input
                id="email"
                type="email"
                placeholder="recipient@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note" className="text-right">Add a note (optional)</Label> {/* Added class */}
              <Input // Changed to Textarea for potentially longer notes
                id="note"
                placeholder="Optional message..."
                value={shareNote}
                onChange={(e) => setShareNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end"> {/* Adjusted footer justification */}
            <Button
              type="button" // Explicit type
              variant="outline"
              onClick={() => setShareDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button" // Explicit type
              onClick={handleShare}
              disabled={!shareEmail} // Disable if no email
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white" // Ensure text color
            >
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnalysisHistory;
