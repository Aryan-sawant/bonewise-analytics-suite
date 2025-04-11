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
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
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
  const {
    user
  } = useAuthContext();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<Analysis[]>([]);
  const [chatInteractions, setChatInteractions] = useState<Record<string, ChatInteraction[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [titleFadeIn, setTitleFadeIn] = useState(false);
  const [contentFadeIn, setContentFadeIn] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  // Removed dateRangeOpen state as it's implicitly handled by filterOpen
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
    if (selectedAnalysis) {
      setTimeout(() => {
        setContentFadeIn(true);
      }, 100);
    }
  }, [selectedAnalysis]);
  useEffect(() => {
    // Apply filters whenever filterOptions change
    applyFilters();
  }, [filterOptions, analyses]);
  const fetchAnalyses = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('analyses').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      });
      if (error) {
        throw error;
      }
      const fetchedAnalyses = data || [];
      setAnalyses(fetchedAnalyses);
      setFilteredAnalyses(fetchedAnalyses); // Initially set filtered to all

      // Pre-fetch chat history for the first analysis if it exists
      if (fetchedAnalyses.length > 0) {
        const firstAnalysisId = fetchedAnalyses[0].id;
        setSelectedAnalysis(firstAnalysisId);
        await fetchChatInteractions(firstAnalysisId);
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
  const fetchChatInteractions = async (analysisId: string) => {
    if (!user || !analysisId) return; // Added check for analysisId

    // Avoid refetching if already loaded
    if (chatInteractions[analysisId]) {
      return;
    }
    try {
      const {
        data,
        error
      } = await supabase.from('chat_interactions').select('*').eq('analysis_id', analysisId).eq('user_id', user.id).order('created_at', {
        ascending: true
      });
      if (error) {
        throw error;
      }
      setChatInteractions(prev => ({
        ...prev,
        [analysisId]: data || []
      }));
    } catch (error) {
      console.error(`Error fetching chat interactions for ${analysisId}:`, error);
      // Optionally show a toast, but might be too noisy if many analyses fail
    }
  };
  const handleSelectAnalysis = async (analysisId: string) => {
    setSelectedAnalysis(analysisId);
    // Fetch chat history if not already loaded
    if (!chatInteractions[analysisId]) {
      await fetchChatInteractions(analysisId);
    }
  };
  const applyFilters = () => {
    let filtered = [...analyses];

    // Apply task type filters
    if (filterOptions.taskTypes.length > 0) {
      filtered = filtered.filter(analysis => filterOptions.taskTypes.includes(analysis.task_name));
    }

    // Apply date range filters
    // Ensure dates are compared correctly (start of day for start, end of day for end)
    if (filterOptions.dateRange.start) {
      const startDate = new Date(filterOptions.dateRange.start);
      startDate.setHours(0, 0, 0, 0); // Set to beginning of the day
      filtered = filtered.filter(analysis => new Date(analysis.created_at) >= startDate);
    }
    if (filterOptions.dateRange.end) {
      const endDate = new Date(filterOptions.dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Set to end of the day
      filtered = filtered.filter(analysis => new Date(analysis.created_at) <= endDate);
    }
    setFilteredAnalyses(filtered);

    // Update selected analysis if necessary
    if (filtered.length > 0) {
      // If current selection is no longer in the filtered list, select the first item
      if (!selectedAnalysis || !filtered.some(a => a.id === selectedAnalysis)) {
        setSelectedAnalysis(filtered[0].id);
        // Fetch chat history for the newly selected analysis if needed
        if (!chatInteractions[filtered[0].id]) {
          fetchChatInteractions(filtered[0].id); // No need to await here
        }
      }
    } else {
      // If no items match filters, clear selection
      setSelectedAnalysis(null);
    }
  };
  const handleFilterChange = (taskName: string) => {
    setFilterOptions(prev => {
      const taskTypes = prev.taskTypes.includes(taskName) ? prev.taskTypes.filter(t => t !== taskName) : [...prev.taskTypes, taskName];
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
        // Ensure null is set if value is empty, otherwise create Date object
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
    // Note: The useEffect hook listening to [filterOptions, analyses]
    // will automatically call applyFilters() and reset the list view.
  };
  const handleExport = async () => {
    if (!selectedAnalysis || !resultsRef.current) {
      toast.warning('Please select an analysis to export.');
      return;
    }
    const analysis = analyses.find(a => a.id === selectedAnalysis);
    if (!analysis) {
      toast.error('Selected analysis data not found.');
      return;
    }
    toast.info('Generating PDF, please wait...', {
      duration: 5000
    });
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const contentElement = resultsRef.current;
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15; // mm

      // --- Header ---
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text(analysis.task_name, margin, margin + 5);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(100); // Gray color
      pdf.text(`Analysis Date: ${new Date(analysis.created_at).toLocaleString()}`, margin, margin + 12);

      // --- Divider ---
      pdf.setDrawColor(200);
      pdf.setLineWidth(0.5);
      pdf.line(margin, margin + 18, pdfWidth - margin, margin + 18);
      let currentY = margin + 25; // Starting Y position for content

      // --- Image (if exists) ---
      if (analysis.image_url) {
        try {
          const imgResponse = await fetch(analysis.image_url);
          const blob = await imgResponse.blob();
          const reader = new FileReader();
          await new Promise<void>((resolve, reject) => {
            reader.onload = () => resolve();
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          const imgDataUrl = reader.result as string;
          const imgProps = pdf.getImageProperties(imgDataUrl);
          const imgMaxW = pdfWidth - 2 * margin;
          const imgMaxH = pdfHeight / 4; // Limit image height initially
          const ratio = Math.min(imgMaxW / imgProps.width, imgMaxH / imgProps.height);
          const imgW = imgProps.width * ratio;
          const imgH = imgProps.height * ratio;
          if (currentY + imgH > pdfHeight - margin) {
            // Check if image fits
            pdf.addPage();
            currentY = margin;
          }
          pdf.addImage(imgDataUrl, 'PNG', margin, currentY, imgW, imgH);
          currentY += imgH + 10; // Add spacing after image
          pdf.setDrawColor(220); // Light gray line after image
          pdf.setLineWidth(0.2);
          pdf.line(margin, currentY - 5, pdfWidth - margin, currentY - 5);
        } catch (imgError) {
          console.error("Error loading or adding image to PDF:", imgError);
          toast.warning("Could not include image in PDF.");
          // Add placeholder text if image fails
          pdf.setFontSize(9);
          pdf.setTextColor(150);
          pdf.text('[Analyzed image could not be loaded]', margin, currentY);
          currentY += 8;
        }
      }

      // --- Results Text (using html2canvas for better formatting) ---
      if (analysis.result_text) {
        const canvas = await html2canvas(contentElement, {
          scale: 2,
          // Increase scale for better quality
          useCORS: true,
          // Important if images within results are from other domains
          logging: false,
          // Reduce console noise
          width: contentElement.scrollWidth,
          // Use scrollWidth for full content width
          height: contentElement.scrollHeight,
          // Use scrollHeight for full content height
          windowWidth: contentElement.scrollWidth,
          windowHeight: contentElement.scrollHeight,
          // Attempt to improve text rendering
          onclone: document => {
            // Potentially apply styles here if needed before rendering
          }
        });
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const contentWidth = pdfWidth - 2 * margin;
        const contentHeight = imgProps.height * contentWidth / imgProps.width;
        let heightLeft = contentHeight;
        let position = currentY;

        // Add the first part
        const pageHeightAvailable = pdfHeight - margin - position;
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
        heightLeft -= pageHeightAvailable;

        // Add new pages if needed
        while (heightLeft > 0) {
          position = -(contentHeight - heightLeft); // Calculate the negative Y offset for the image on the new page
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight); // Add image starting from top margin
          heightLeft -= pdfHeight - 2 * margin;
        }
      } else {
        if (currentY > pdfHeight - margin - 10) {
          // Check if text fits
          pdf.addPage();
          currentY = margin;
        }
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text('No analysis results text available.', margin, currentY);
      }

      // --- Footer (Page Numbers) ---
      const pageCount = (pdf.internal as any).getNumberOfPages(); // Access internal property
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(`Page ${i} of ${pageCount}`, pdfWidth / 2, pdfHeight - margin / 2, {
          align: 'center'
        });
      }

      // --- Save ---
      pdf.save(`${analysis.task_name}_${new Date(analysis.created_at).toISOString().split('T')[0]}.pdf`);
      toast.success('PDF generated successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF. See console for details.');
    }
  };
  const handleShare = async () => {
    if (!shareEmail || !selectedAnalysis) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(shareEmail)) {
      toast.error('Invalid email format.');
      return;
    }

    // --- Simulated Sharing ---
    // In a real app: call backend API to send email with analysis link/data
    console.log(`Sharing analysis ${selectedAnalysis} with ${shareEmail}. Note: ${shareNote}`);
    toast.promise(new Promise(resolve => setTimeout(resolve, 1500)),
    // Simulate network delay
    {
      loading: 'Sending share email...',
      success: `Analysis shared with ${shareEmail}`,
      error: 'Failed to share analysis'
    });
    // --- End Simulation ---

    setShareDialogOpen(false);
    setShareEmail('');
    setShareNote('');
  };

  // Enhanced Format results function
  const formatResults = (resultsText: string | null): React.ReactNode => {
    if (!resultsText) return <p className="text-muted-foreground">No results text available.</p>;
    try {
      // Normalize line breaks and remove potential excessive spacing
      const normalizedText = resultsText.replace(/\r\n/g, '\n').replace(/ +\n/g, '\n').trim();

      // Remove markdown code blocks (``` ... ```)
      const textWithoutCodeBlocks = normalizedText.replace(/```[\s\S]*?```/g, '[Code Block Removed]');

      // Split into logical blocks (paragraphs, lists, headings)
      // This regex tries to split by double newlines, but also considers lines starting with # or list markers as potential new blocks.
      const blocks = textWithoutCodeBlocks.split(/(\n\n+|\n(?=[*\-•#\d+\.\s]))/).filter(block => block && block.trim() !== '');
      return <div className="space-y-3 leading-relaxed"> {/* Reduced space-y */}
                 {blocks.map((block, index) => {
          const trimmedBlock = block.trim();

          // Headings (Markdown style: #, ##, ### etc.)
          const headingMatch = trimmedBlock.match(/^(#{1,5})\s+(.*)/);
          if (headingMatch) {
            const level = headingMatch[1].length;
            const text = headingMatch[2];
            const Tag = `h${level + 1}` as keyof JSX.IntrinsicElements; // h2, h3, h4...
            const textSize = ['text-xl', 'text-lg', 'text-md', 'text-md', 'text-md'][level - 1] || 'text-base'; // Adjust sizes
            return <Tag key={index} className={`${textSize} font-semibold mt-4 mb-1 text-primary/90 border-b pb-1`}>{text}</Tag>;
          }

          // Specific keyword headings (Summary:, Findings:, etc.)
          const keywordHeadingMatch = trimmedBlock.match(/^(Summary|Findings|Interpretation|Recommendations|Assessment|Diagnosis|Conclusion|Analysis Results)\s*[:*]?(.*)/i);
          if (keywordHeadingMatch) {
            // Use group 2 if it exists (text after the keyword), otherwise use the keyword itself
            const text = keywordHeadingMatch[2] && keywordHeadingMatch[2].trim() ? keywordHeadingMatch[2].trim() : keywordHeadingMatch[1];
            return <h3 key={index} className="text-lg font-semibold mt-4 mb-1 text-primary/90 border-b pb-1">{text}</h3>;
          }

          // Unordered Lists (*, -, •)
          if (trimmedBlock.match(/^[*•-]\s+/)) {
            // Assume the whole block is a list if it starts with a marker
            const listItems = trimmedBlock.split('\n').map(line => line.trim().replace(/^[*•-]\s+/, ''));
            return <ul key={index} className="list-disc pl-5 space-y-1">
                                 {listItems.filter(item => item).map((item, i) => <li key={i} className="text-gray-700 dark:text-gray-300 text-sm" dangerouslySetInnerHTML={{
                __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<em>$1</em>')
              }} />)}
                             </ul>;
          }

          // Ordered Lists (1., 2., etc.) - Basic handling
          if (trimmedBlock.match(/^\d+\.\s+/)) {
            const listItems = trimmedBlock.split('\n').map(line => line.trim().replace(/^\d+\.\s+/, ''));
            return <ol key={index} className="list-decimal pl-5 space-y-1">
                                 {listItems.filter(item => item).map((item, i) => <li key={i} className="text-gray-700 dark:text-gray-300 text-sm" dangerouslySetInnerHTML={{
                __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<em>$1</em>')
              }} />)}
                             </ol>;
          }

          // Default: Paragraph
          // Apply bold/italic formatting within paragraphs
          return <p key={index} className="text-gray-700 dark:text-gray-300 text-sm" dangerouslySetInnerHTML={{
            __html: trimmedBlock.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<em>$1</em>')
          }} />;
        })}
             </div>;
    } catch (e) {
      console.error("Error formatting results:", e);
      // Fallback to plain text if formatting fails
      return <pre className="whitespace-pre-wrap text-sm">{resultsText}</pre>;
    }
  };
  const getAnalysisById = (id: string | null) => {
    if (!id) return null;
    return analyses.find(analysis => analysis.id === id) || null;
  };
  const selectedAnalysisData = getAnalysisById(selectedAnalysis);
  return <div className="container mx-auto px-4 py-12">
      <style>
        {`
        :root {
            --primary-rgb: 83, 109, 254; /* Example: Indigo-500 */
            --primary: #536dfe; /* Example: Indigo-500 */
            /* Add other theme colors if needed */
            --card-bg: #ffffff;
            --card-bg-dark: #1f2937; /* gray-800 (example) */
            --text-primary-light: #1f2937; /* gray-800 */
            --text-primary-dark: #f9fafb; /* gray-50 */
            --text-muted-light: #6b7280; /* gray-500 */
            --text-muted-dark: #9ca3af; /* gray-400 */
            --border-light: #e5e7eb; /* gray-200 */
            --border-dark: #374151; /* gray-700 */
        }
        html.dark {
            --card-bg: var(--card-bg-dark);
            --text-primary: var(--text-primary-dark);
            --text-muted: var(--text-muted-dark);
            --border-color: var(--border-dark);
        }
         html:not(.dark) {
            --card-bg: var(--card-bg-light);
             --text-primary: var(--text-primary-light);
             --text-muted: var(--text-muted-light);
             --border-color: var(--border-light);
        }

        /* General Styles */
        body {
             background-color: #f8fafc; /* Light gray background */
        }
        html.dark body {
             background-color: #111827; /* Darker gray */
        }

        .hover-scale {
          transition: transform 0.2s ease-out;
        }
        .hover-scale:hover {
          transform: scale(1.05);
        }

        .hover-card {
          transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
          background-color: var(--card-bg);
        }
        .hover-card:hover {
          transform: translateZ(5px) translateY(-3px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }

        .hover-list-item {
          transition: all 0.2s ease-out;
          border-left: 3px solid transparent;
          padding-left: 9px; /* Base padding */
        }
        .hover-list-item:hover {
          border-left-color: var(--primary);
          background-color: rgba(var(--primary-rgb), 0.05);
          padding-left: 12px;
          transform: translateX(2px);
        }
        .hover-list-item.active {
          border-left-color: var(--primary);
          background-color: rgba(var(--primary-rgb), 0.1);
          padding-left: 12px;
          font-weight: 500;
        }

        .hover-tab-trigger {
            transition: background-color 0.2s ease-out, color 0.2s ease-out, box-shadow 0.2s ease-out;
            border-radius: 0.375rem; /* rounded-md */
            flex: 1; /* Make triggers fill the space */
            font-size: 0.875rem; /* text-sm */
            padding: 0.5rem 0; /* Adjust padding */
        }
        [data-state=inactive].hover-tab-trigger:hover {
            background-color: rgba(var(--primary-rgb), 0.08);
            color: var(--primary);
        }
        [data-state=active].hover-tab-trigger {
            background-color: var(--primary); /* Solid primary bg for active */
            color: white; /* White text for active */
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            font-weight: 500;
        }
        /* Container for tabs list */
        .tabs-list-container {
            background-color: #e5e7eb; /* gray-200 */
            padding: 0.25rem; /* p-1 */
            border-radius: 0.5rem; /* rounded-lg */
        }
        html.dark .tabs-list-container {
             background-color: #374151; /* gray-700 */
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
          max-width: 85%; /* Ensure messages don't get too wide */
        }
        .hover-message:hover, .hover-ai-message:hover {
          transform: translateY(-2px) translateZ(2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
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

         /* Prose adjustments */
        .prose {
            --tw-prose-body: var(--text-primary);
            --tw-prose-headings: var(--text-primary);
            --tw-prose-lead: var(--text-muted);
            --tw-prose-links: var(--primary);
            --tw-prose-bold: var(--text-primary);
            --tw-prose-counters: var(--text-muted);
            --tw-prose-bullets: var(--text-muted);
            --tw-prose-hr: var(--border-color);
            --tw-prose-quotes: var(--text-primary);
            --tw-prose-quote-borders: var(--primary);
            --tw-prose-captions: var(--text-muted);
            --tw-prose-code: var(--text-primary);
            --tw-prose-pre-code: var(--text-primary-dark); /* Usually light on dark bg */
            --tw-prose-pre-bg: #111827; /* Dark bg for code */
            --tw-prose-th-borders: var(--border-color);
            --tw-prose-td-borders: var(--border-color);
            font-size: 0.875rem; /* text-sm default */
        }
        .dark .prose {
           --tw-prose-pre-code: var(--text-primary-light); /* Usually dark on light bg */
            --tw-prose-pre-bg: #f3f4f6; /* Light bg for code */
        }
        .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
             color: var(--primary); /* Use primary color for headings */
             font-weight: 600; /* Semibold */
             margin-top: 1.25em;
             margin-bottom: 0.5em;
        }
         .prose h2 { font-size: 1.25em; } /* Adjust heading sizes relative to base */
         .prose h3 { font-size: 1.1em; }
         .prose h4 { font-size: 1.0em; }
         .prose strong, .prose b {
            color: inherit; /* Inherit color */
            font-weight: 600;
        }
         .prose ul, .prose ol { padding-left: 1.25rem; margin-top: 0.5em; margin-bottom: 0.75em;}
         .prose li { margin-top: 0.2em; margin-bottom: 0.2em; }
         .prose p { margin-top: 0.5em; margin-bottom: 0.75em;}

         /* Fade Animations */
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
        {/* Navigation Buttons */}
         <Button variant="gradient" size="sm" onClick={() => navigate('/tasks')} className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl">
           <svg className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
           Dashboard
         </Button>
         <Button variant="gradient" size="sm" onClick={() => navigate('/')} className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl">
           <Home className="h-4 w-4" />
           Home
         </Button>
      </div>

       {/* Page Title Section */}
       <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 p-6 rounded-xl mb-8 shadow-sm border border-black/5 dark:border-white/5">
           <h1 className={`text-2xl md:text-3xl font-bold mb-1 text-gray-800 dark:text-gray-100 ${titleFadeIn ? 'fade-in-title visible' : 'fade-in-title'}`}>
               Analysis History
           </h1>
           <p className="text-sm text-muted-foreground">
               Review past analyses, results, and associated chat discussions.
           </p>
       </div>


      {/* Filter and Action Bar */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3 px-1">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
                <Filter size={14} />
                Filter
                {(filterOptions.taskTypes.length > 0 || filterOptions.dateRange.start || filterOptions.dateRange.end) && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary flex items-center justify-center text-[10px] font-semibold text-primary-foreground">
                    {filterOptions.taskTypes.length + (filterOptions.dateRange.start || filterOptions.dateRange.end ? 1 : 0)}
                  </span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="start">
                {/* Content from previous version's combined filter popover */}
                <div className="space-y-4 mb-4 pb-4 border-b dark:border-gray-700">
                   <div className="flex items-center justify-between">
                     <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200">Analysis Type</h4>
                     {filterOptions.taskTypes.length > 0 && <Button variant="ghost" size="sm" onClick={() => setFilterOptions(prev => ({
                  ...prev,
                  taskTypes: []
                }))} className="h-6 px-1 text-xs text-muted-foreground hover:text-primary">Clear</Button>}
                   </div>
                   <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                     {uniqueTaskTypes.length > 0 ? uniqueTaskTypes.map(taskName => <div key={taskName} className="flex items-center space-x-2">
                         <Checkbox id={`filter-${taskName}`} checked={filterOptions.taskTypes.includes(taskName)} onCheckedChange={() => handleFilterChange(taskName)} className="h-3.5 w-3.5" />
                         <Label htmlFor={`filter-${taskName}`} className="text-xs font-normal text-gray-700 dark:text-gray-300 cursor-pointer">{taskName}</Label>
                       </div>) : <p className="text-xs text-muted-foreground">No types found.</p>}
                   </div>
                </div>
                 <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200">Date Range</h4>
                     {(filterOptions.dateRange.start || filterOptions.dateRange.end) && <Button variant="ghost" size="sm" onClick={() => setFilterOptions(prev => ({
                  ...prev,
                  dateRange: {
                    start: null,
                    end: null
                  }
                }))} className="h-6 px-1 text-xs text-muted-foreground hover:text-primary">Clear</Button>}
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
                 {(filterOptions.taskTypes.length > 0 || filterOptions.dateRange.start || filterOptions.dateRange.end) && <Button variant="link" size="sm" onClick={clearFilters} className="w-full mt-3 text-xs text-center text-primary hover:underline">Clear All Filters</Button>}
            </PopoverContent>
          </Popover>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs" disabled={!selectedAnalysisData} onClick={handleExport}>
            <Download size={14} /> Export PDF
          </Button>
          
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? <div className="flex justify-center items-center h-64">
           <div className="relative">
             <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
               <Bone className="h-5 w-5 text-primary animate-pulse" />
             </div>
           </div>
         </div> : filteredAnalyses.length === 0 ? <Card className="border shadow-sm hover-card transition-all rounded-xl border-dashed border-gray-300 dark:border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <Filter className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2 text-center text-gray-700 dark:text-gray-300">No Matching Analyses Found</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              {analyses.length > 0 ? 'Adjust your filters or clear them to see all past analyses.' : 'You haven\'t performed any bone health analyses yet.'}
            </p>
            {analyses.length > 0 ? <Button onClick={clearFilters} size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover-scale transition-all text-white rounded-md text-xs px-4 py-1.5">
                <X className="mr-1.5 h-3.5 w-3.5" /> Clear Filters
              </Button> : <Button onClick={() => navigate('/tasks')} size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover-scale transition-all text-white rounded-md text-xs px-4 py-1.5">
                <Bone className="mr-1.5 h-3.5 w-3.5" /> Start New Analysis
              </Button>}
          </CardContent>
        </Card> : <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> {/* Reduced gap */}
          {/* Past Analyses List Card */}
           <Card className="col-span-1 border rounded-xl shadow-sm overflow-hidden hover-card transition-all">
                {/* === MODIFIED HEADER 1 === */}
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 border-b border-blue-700/50 text-white">
                  <CardTitle className="flex items-center text-base font-semibold"> {/* Title text color inherited */}
                    <Clock className="h-4 w-4 mr-2 text-white/90" /> {/* Icon color adjusted */}
                    Past Analyses {filteredAnalyses.length !== analyses.length && `(${filteredAnalyses.length} / ${analyses.length})`}
                  </CardTitle>
                </CardHeader>
                {/* === END MODIFIED HEADER 1 === */}
               <CardContent className="p-1.5"> {/* Reduced padding */}
                 <div className="space-y-1 max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar pr-1"> {/* Adjusted max-h */}
                   {filteredAnalyses.map(analysis => <div key={analysis.id} className={`p-2.5 rounded-md cursor-pointer transition-all hover-list-item ${selectedAnalysis === analysis.id ? 'active' : ''}`} onClick={() => handleSelectAnalysis(analysis.id)}>
                       <div className={`font-medium text-sm truncate ${selectedAnalysis === analysis.id ? 'text-primary' : 'text-gray-800 dark:text-gray-100'}`}>
                         {analysis.task_name}
                       </div>
                       <div className="text-xs mt-1 flex items-center text-muted-foreground space-x-1.5"> {/* Added space-x */}
                           <Calendar className="h-3 w-3" />
                           <span>{new Date(analysis.created_at).toLocaleDateString()}</span>
                           <span className="text-gray-300 dark:text-gray-600">·</span>
                           <Clock className="h-3 w-3" />
                           <span>{new Date(analysis.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                       </div>
                     </div>)}
                 </div>
               </CardContent>
           </Card>


          {/* Analysis Details Card */}
           <Card className="col-span-1 lg:col-span-2 border shadow-sm rounded-xl overflow-hidden hover-card transition-all">
                 {/* === MODIFIED HEADER 2 === */}
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 border-b border-blue-700/50 text-white">
                  <CardTitle className="flex items-center text-base font-semibold"> {/* Title text color inherited */}
                    {selectedAnalysisData ? <>
                        <Bone className="h-4 w-4 mr-2 text-white/90" /> {/* Icon color adjusted */}
                        {selectedAnalysisData.task_name}
                      </> : 'Analysis Details'}
                  </CardTitle>
                </CardHeader>
                 {/* === END MODIFIED HEADER 2 === */}
               <CardContent className={`pt-4 p-4 md:p-5 ${contentFadeIn ? 'fade-in-content visible' : 'fade-in-content'}`}> {/* Adjusted padding */}
                 {selectedAnalysisData ? <Tabs defaultValue="results" className="w-full">
                      <TabsList className="mb-4 grid w-full grid-cols-2 tabs-list-container">
                       <TabsTrigger value="results" className="hover-tab-trigger">
                         Analysis Results
                       </TabsTrigger>
                       <TabsTrigger value="chat" className="hover-tab-trigger">
                         Chat History
                       </TabsTrigger>
                     </TabsList>


                     <TabsContent value="results" className="space-y-4 max-h-[calc(100vh-370px)] overflow-y-auto custom-scrollbar pr-2 -mr-1"> {/* Adjusted max-h */}
                       {selectedAnalysisData.image_url && <div className="mb-5 border rounded-lg p-3 hover-image-card transition-all overflow-hidden bg-gray-50 dark:bg-gray-800/50 shadow-sm">
                           <h3 className="font-medium text-sm mb-2 flex items-center text-gray-700 dark:text-gray-300">
                             <svg className="h-4 w-4 mr-1.5 text-primary/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                             Analyzed Image
                           </h3>
                           <div className="flex justify-center">
                             <img src={selectedAnalysisData.image_url} alt="Analyzed bone" className="max-h-52 md:max-h-60 object-contain rounded-md cursor-pointer transition-transform hover:scale-[1.03]" onClick={() => window.open(selectedAnalysisData.image_url, '_blank')} />
                           </div>
                         </div>}
                       {/* Analysis Results Text */}
                        <div ref={resultsRef} className="prose dark:prose-invert max-w-none">
                         {formatResults(selectedAnalysisData.result_text)}
                       </div>
                     </TabsContent>


                     <TabsContent value="chat" className="max-h-[calc(100vh-370px)] overflow-y-auto custom-scrollbar pr-2 -mr-1"> {/* Adjusted max-h */}
                       {chatInteractions[selectedAnalysisData.id]?.length > 0 ? <div className="space-y-4">
                           {chatInteractions[selectedAnalysisData.id].map(chat => <div key={chat.id} className="space-y-2 text-sm">
                               <div className="flex justify-end group">
                                 <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-2.5 rounded-lg rounded-tr-none hover-message transition-all shadow-md relative">
                                   {chat.user_message}
                                   <div className="text-xs text-blue-200/80 pt-1 text-right">
                                     {new Date(chat.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                                   </div>
                                 </div>
                               </div>
                               <div className="flex justify-start group">
                                 <div className="bg-gray-100 dark:bg-gray-700 p-2.5 rounded-lg rounded-tl-none hover-ai-message transition-all shadow-md relative text-gray-800 dark:text-gray-100">
                                   {chat.ai_response}
                                    <div className="text-xs text-gray-400 dark:text-gray-500 pt-1 text-left">
                                     {new Date(chat.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                                   </div>
                                 </div>
                               </div>
                             </div>)}
                         </div> : <div className="text-center py-10 px-4">
                           <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 mb-3">
                             <svg className="h-6 w-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                           </div>
                           <p className="text-sm text-muted-foreground mb-4">No chat interactions recorded for this analysis.</p>
                           <Button variant="outline" size="sm" className="mt-2 hover-scale transition-all text-xs px-3 py-1 h-auto" onClick={() => navigate(`/analysis/${selectedAnalysisData.task_id}?analysisId=${selectedAnalysisData.id}`)}>
                             Discuss Results <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                           </Button>
                         </div>}
                     </TabsContent>
                   </Tabs> : <div className="flex justify-center items-center h-64 text-muted-foreground text-sm">
                     Select an analysis from the list to view details.
                   </div>}
               </CardContent>
           </Card>

        </div>}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Share Analysis Results</DialogTitle>
            {/* <DialogDescription>Enter recipient details below.</DialogDescription> */}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">Email address</Label>
              <Input id="email" type="email" placeholder="recipient@example.com" value={shareEmail} onChange={e => setShareEmail(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-xs font-medium">Add a note (optional)</Label>
               <Textarea // Use Textarea instead of Input
            id="note" placeholder="Include a brief message..." value={shareNote} onChange={e => setShareNote(e.target.value)} className="text-sm min-h-[60px]" // Basic styling for textarea
            rows={3} />
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShareDialogOpen(false)}>Cancel</Button>
            <Button type="button" size="sm" onClick={handleShare} disabled={!shareEmail || !/\S+@\S+\.\S+/.test(shareEmail)} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90 disabled:opacity-50">
              Share Analysis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default AnalysisHistory;