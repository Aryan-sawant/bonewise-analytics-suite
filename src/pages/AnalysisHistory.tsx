import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Home, ArrowRight, Clock, Bone, Calendar, Filter, Download, Share2, X, ImageOff } from 'lucide-react'; // Added ImageOff
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import jsPDF from 'jspdf';
// html2canvas is no longer needed for PDF generation

// Interfaces remain the same
interface Analysis {
  id: string;
  task_id: string; // Keep task_id for potential use
  task_name: string;
  image_url: string | null;
  result_text: string | null;
  created_at: string;
  user_id: string; // Ensure user_id is selected if needed elsewhere
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
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareNote, setShareNote] = useState('');

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    taskTypes: [],
    dateRange: { start: null, end: null }
  });

  const uniqueTaskTypes = [...new Set(analyses.map(a => a.task_name))];

  // Ref for the results *display* area (still useful for copy/paste, etc.)
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

  useEffect(() => {
    applyFilters();
  }, [filterOptions, analyses]);

  const fetchAnalyses = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Select all necessary fields, including user_id
      const { data, error } = await supabase
        .from('analyses')
        .select('id, task_id, task_name, image_url, result_text, created_at, user_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) { throw error; }
      const fetchedAnalyses = data || [];
      setAnalyses(fetchedAnalyses);
      setFilteredAnalyses(fetchedAnalyses); // Initial set

      if (fetchedAnalyses.length > 0) {
        const firstAnalysisId = fetchedAnalyses[0].id;
        // Check if location state provides a specific analysisId to select
        const locationState = location.state as { analysisId?: string };
        const targetAnalysisId = locationState?.analysisId && fetchedAnalyses.some(a => a.id === locationState.analysisId)
                                 ? locationState.analysisId
                                 : firstAnalysisId;

        setSelectedAnalysis(targetAnalysisId);
        await fetchChatInteractions(targetAnalysisId);
        // Clear location state after using it
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


  const fetchChatInteractions = async (analysisId: string) => {
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

  const handleSelectAnalysis = async (analysisId: string) => {
    setSelectedAnalysis(analysisId);
    if (!chatInteractions[analysisId]) {
      await fetchChatInteractions(analysisId);
    }
  };

  const applyFilters = () => {
    let filtered = [...analyses];
    if (filterOptions.taskTypes.length > 0) {
      filtered = filtered.filter(analysis => filterOptions.taskTypes.includes(analysis.task_name));
    }
    if (filterOptions.dateRange.start) {
      const startDate = new Date(filterOptions.dateRange.start);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(analysis => new Date(analysis.created_at) >= startDate);
    }
    if (filterOptions.dateRange.end) {
      const endDate = new Date(filterOptions.dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(analysis => new Date(analysis.created_at) <= endDate);
    }
    setFilteredAnalyses(filtered);

    if (filtered.length > 0) {
      if (!selectedAnalysis || !filtered.some(a => a.id === selectedAnalysis)) {
        const newSelectedId = filtered[0].id;
        setSelectedAnalysis(newSelectedId);
        if (!chatInteractions[newSelectedId]) {
          fetchChatInteractions(newSelectedId);
        }
      }
    } else {
      setSelectedAnalysis(null);
    }
  };

  const handleFilterChange = (taskName: string) => { /* ... (unchanged) ... */
    setFilterOptions(prev => {
      const taskTypes = prev.taskTypes.includes(taskName) ? prev.taskTypes.filter(t => t !== taskName) : [...prev.taskTypes, taskName];
      return { ...prev, taskTypes };
    });
   };
  const handleDateRangeChange = (type: 'start' | 'end', value: string) => { /* ... (unchanged) ... */
    setFilterOptions(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [type]: value ? new Date(value) : null }
    }));
   };
  const clearFilters = () => { /* ... (unchanged) ... */
    setFilterOptions({
      taskTypes: [], dateRange: { start: null, end: null }
    });
   };

  // --- NEW PDF Export Logic ---
  const handleExport = async () => {
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
    const imageSourceUrl = analysis.image_url; // Get the stored URL

    try {
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const analysisDate = new Date(analysis.created_at).toLocaleString();
        const margin = 20;
        const contentWidth = pdf.internal.pageSize.getWidth() - 2 * margin;
        const pageHeight = pdf.internal.pageSize.getHeight();
        let yPos = margin;

        // Helper function for adding text with page break handling
        const addText = (text: string, size: number, style: 'normal' | 'bold' | 'italic' = 'normal', spacing = 5) => {
            pdf.setFontSize(size);
            pdf.setFont('helvetica', style);
            const lines = pdf.splitTextToSize(text, contentWidth);
            lines.forEach((line: string) => {
                if (yPos + size / 2.5 > pageHeight - margin) { // Estimate line height check
                    pdf.addPage();
                    yPos = margin;
                }
                pdf.text(line, margin, yPos);
                yPos += size / 2.5 + 1; // Move yPos down
            });
            yPos += spacing; // Add extra spacing after the block
        };

        // 1. Title, Date, User
        addText(analysis.task_name, 18, 'bold', 5);
        yPos += 5;
        addText(`Analysis Date: ${analysisDate}`, 10, 'normal', 2);
        if (user) { // Add user info if available from context
            addText(`User: ${user.email || 'Unknown'}`, 10, 'normal', 5);
        }
        yPos += 5;

        // 2. Add Image Section (Only use imageSourceUrl)
        addText('Medical Image', 14, 'bold', 3);
        if (yPos > pageHeight - margin - 30) { // Check space before image section
            pdf.addPage();
            yPos = margin;
            addText('Medical Image', 14, 'bold', 3); // Re-add title on new page
        }
        let imageAddedSuccessfully = false;

        if (imageSourceUrl) {
            console.log("PDF Gen: Attempting image from URL:", imageSourceUrl);
            try {
                const img = new Image();
                img.crossOrigin = "Anonymous"; // Important for CORS
                img.src = imageSourceUrl;

                const imgLoaded = await new Promise<HTMLImageElement | null>((resolve) => {
                    img.onload = () => resolve(img);
                    img.onerror = (e) => {
                        console.error("PDF Gen Error: Failed to load image from URL.", "URL:", imageSourceUrl, "Error:", e);
                        resolve(null);
                    };
                    setTimeout(() => {
                         console.warn("PDF Gen Warning: Image load timeout for URL:", imageSourceUrl);
                         resolve(null);
                    }, 20000); // 20 seconds timeout
                });

                if (imgLoaded) {
                    const imgProps = pdf.getImageProperties(imgLoaded);
                    const aspectRatio = imgProps.width / imgProps.height;
                    const availableHeight = pageHeight - yPos - margin;
                    let imgWidth = contentWidth;
                    let imgHeight = imgWidth / aspectRatio;

                    if (imgHeight > availableHeight) {
                        imgHeight = availableHeight;
                        imgWidth = imgHeight * aspectRatio;
                         if (imgWidth > contentWidth) {
                            imgWidth = contentWidth;
                            imgHeight = imgWidth / aspectRatio;
                         }
                    }

                    const xOffset = margin + (contentWidth - imgWidth) / 2;

                    if (yPos + imgHeight > pageHeight - margin) { // Check page break for image itself
                       pdf.addPage();
                       yPos = margin;
                       addText('Medical Image (cont.)', 14, 'bold', 3);
                    }

                    pdf.addImage(imgLoaded, imgProps.fileType, xOffset, yPos, imgWidth, imgHeight);
                    yPos += imgHeight + 10;
                    imageAddedSuccessfully = true;
                    console.log("PDF Gen: Image added successfully from URL.");
                } else {
                     console.log("PDF Gen: Failed to load image from URL.");
                }
            } catch (urlImgError) {
                console.error("PDF Gen Error: Exception processing image from URL:", urlImgError);
            }
        } else {
             console.log("PDF Gen: No image_url found for this analysis.");
        }

        // Add error message if image failed or wasn't present
        if (!imageAddedSuccessfully) {
            if (yPos > pageHeight - margin - 10) {
                pdf.addPage();
                yPos = margin;
             }
            addText("Error: Could not load the medical image for the PDF.", 10, 'italic', 5);
            console.log("PDF Gen: Failed to add image from URL or URL was missing.");
            yPos += 5;
        }


        // 3. Add Analysis Results (using direct text rendering)
        if (analysis.result_text) {
            if (yPos > pageHeight - margin - 20) { // Check space before results section
                 pdf.addPage();
                 yPos = margin;
            }
            addText('Analysis Results', 14, 'bold', 5);

            // Clean and format text (similar to AnalysisPage)
             const cleanResults = analysis.result_text
                .replace(/\r\n/g, '\n')
                .replace(/```[\s\S]*?```/g, '\n[Code Block Removed]\n')
                .replace(/^(#{1,5})\s+(.*)/gm, (match, p1, p2) => `\n**${p2.trim()}**\n`)
                .replace(/^(Summary|Findings|Interpretation|Recommendations|Assessment|Diagnosis|Conclusion|Analysis Results)\s*[:*]?/gmi, '\n**$1:**')
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/__(.*?)__/g, '$1')
                .replace(/^[*•-]\s+/gm, '  • ')
                .replace(/^\d+\.\s+/gm, (match) => `  ${match}`)
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/?(p|strong|b|em|i|ul|ol|li|h[1-6])>/gi, '')
                .replace(/ /g, ' ')
                .replace(/ +\n/g, '\n')
                .replace(/\n{3,}/g, '\n\n')
                .trim();

            const resultBlocks = cleanResults.split('\n\n');

            resultBlocks.forEach(block => {
                const trimmedBlock = block.trim();
                if (!trimmedBlock) return;

                if (trimmedBlock.startsWith('**') && trimmedBlock.endsWith('**')) {
                    addText(trimmedBlock.slice(2, -2), 12, 'bold', 3);
                } else if (trimmedBlock.startsWith('**') && trimmedBlock.endsWith(':')) {
                    addText(trimmedBlock.slice(2), 12, 'bold', 3);
                } else {
                     addText(trimmedBlock, 10, 'normal', 3);
                }
                yPos += 2; // Add small space between blocks
            });
        } else {
             if (yPos > pageHeight - margin - 10) { pdf.addPage(); yPos = margin; }
             addText('No analysis results text available.', 10, 'italic', 5);
        }

        // 4. Add Page Numbers
        const pageCount = pdf.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(150);
            pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });
        }

        // 5. Save the PDF
        const dateStr = new Date(analysis.created_at).toISOString().split('T')[0];
        const cleanTitle = analysis.task_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        pdf.save(`${cleanTitle}_history_${dateStr}.pdf`);

        toast.success('PDF exported successfully!', { id: toastId });
    } catch (error) {
        console.error('Error exporting PDF:', error);
        toast.error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: toastId });
    }
  };
  // --- END NEW PDF Export Logic ---

  const handleShare = async () => { /* ... (unchanged, keep simulation or implement real backend call) ... */
    if (!shareEmail || !selectedAnalysis) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(shareEmail)) {
      toast.error('Invalid email format.');
      return;
    }

    // --- Simulated Sharing ---
    console.log(`Sharing analysis ${selectedAnalysis} with ${shareEmail}. Note: ${shareNote}`);
    toast.promise(new Promise(resolve => setTimeout(resolve, 1500)),
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

  const formatResults = (resultsText: string | null): React.ReactNode => { /* ... (unchanged) ... */
      if (!resultsText) return <p className="text-muted-foreground">No results text available.</p>;
      try {
        const normalizedText = resultsText.replace(/\r\n/g, '\n').replace(/ +\n/g, '\n').trim();
        const textWithoutCodeBlocks = normalizedText.replace(/```[\s\S]*?```/g, '[Code Block Removed]');
        const blocks = textWithoutCodeBlocks.split(/(\n\n+|\n(?=[*\-•#\d+\.\s]))/).filter(block => block && block.trim() !== '');
        return <div className="space-y-3 leading-relaxed">
                   {blocks.map((block, index) => {
            const trimmedBlock = block.trim();
            const headingMatch = trimmedBlock.match(/^(#{1,5})\s+(.*)/);
            if (headingMatch) {
              const level = headingMatch[1].length;
              const text = headingMatch[2];
              const Tag = `h${level + 1}` as keyof JSX.IntrinsicElements;
              const textSize = ['text-xl', 'text-lg', 'text-md', 'text-md', 'text-md'][level - 1] || 'text-base';
              return <Tag key={index} className={`${textSize} font-semibold mt-4 mb-1 text-primary/90 border-b pb-1`}>{text}</Tag>;
            }
            const keywordHeadingMatch = trimmedBlock.match(/^(Summary|Findings|Interpretation|Recommendations|Assessment|Diagnosis|Conclusion|Analysis Results)\s*[:*]?(.*)/i);
            if (keywordHeadingMatch) {
              const text = keywordHeadingMatch[2] && keywordHeadingMatch[2].trim() ? keywordHeadingMatch[2].trim() : keywordHeadingMatch[1];
              return <h3 key={index} className="text-lg font-semibold mt-4 mb-1 text-primary/90 border-b pb-1">{text}</h3>;
            }
            if (trimmedBlock.match(/^[*•-]\s+/)) {
              const listItems = trimmedBlock.split('\n').map(line => line.trim().replace(/^[*•-]\s+/, ''));
              return <ul key={index} className="list-disc pl-5 space-y-1">
                                   {listItems.filter(item => item).map((item, i) => <li key={i} className="text-gray-700 dark:text-gray-300 text-sm" dangerouslySetInnerHTML={{__html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<em>$1</em>')}} />)}
                               </ul>;
            }
            if (trimmedBlock.match(/^\d+\.\s+/)) {
              const listItems = trimmedBlock.split('\n').map(line => line.trim().replace(/^\d+\.\s+/, ''));
              return <ol key={index} className="list-decimal pl-5 space-y-1">
                                   {listItems.filter(item => item).map((item, i) => <li key={i} className="text-gray-700 dark:text-gray-300 text-sm" dangerouslySetInnerHTML={{__html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<em>$1</em>')}} />)}
                               </ol>;
            }
            return <p key={index} className="text-gray-700 dark:text-gray-300 text-sm" dangerouslySetInnerHTML={{__html: trimmedBlock.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<em>$1</em>')}} />;
          })}
               </div>;
      } catch (e) {
        console.error("Error formatting results:", e);
        return <pre className="whitespace-pre-wrap text-sm">{resultsText}</pre>;
      }
   };

  const getAnalysisById = (id: string | null): Analysis | null => {
    if (!id) return null;
    return analyses.find(analysis => analysis.id === id) || null;
  };

  const selectedAnalysisData = getAnalysisById(selectedAnalysis);

  return (
    <div className="container mx-auto px-4 py-12">
       {/* Styles (unchanged) */}
       <style>{`
        /* ... (keep all the styles from the previous version) ... */
        :root {
            --primary-rgb: 83, 109, 254; /* Example: Indigo-500 */
            --primary: #536dfe; /* Example: Indigo-500 */
            --card-bg: #ffffff;
            --card-bg-dark: #1f2937;
            --text-primary-light: #1f2937;
            --text-primary-dark: #f9fafb;
            --text-muted-light: #6b7280;
            --text-muted-dark: #9ca3af;
            --border-light: #e5e7eb;
            --border-dark: #374151;
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
        body { background-color: #f8fafc; }
        html.dark body { background-color: #111827; }
        .hover-scale { transition: transform 0.2s ease-out; }
        .hover-scale:hover { transform: scale(1.05); }
        .hover-card { transition: transform 0.3s ease-out, box-shadow 0.3s ease-out; background-color: var(--card-bg); }
        .hover-card:hover { transform: translateZ(5px) translateY(-3px); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12); }
        .hover-list-item { transition: all 0.2s ease-out; border-left: 3px solid transparent; padding-left: 9px; }
        .hover-list-item:hover { border-left-color: var(--primary); background-color: rgba(var(--primary-rgb), 0.05); padding-left: 12px; transform: translateX(2px); }
        .hover-list-item.active { border-left-color: var(--primary); background-color: rgba(var(--primary-rgb), 0.1); padding-left: 12px; font-weight: 500; }
        .hover-tab-trigger { transition: background-color 0.2s ease-out, color 0.2s ease-out, box-shadow 0.2s ease-out; border-radius: 0.375rem; flex: 1; font-size: 0.875rem; padding: 0.5rem 0; }
        [data-state=inactive].hover-tab-trigger:hover { background-color: rgba(var(--primary-rgb), 0.08); color: var(--primary); }
        [data-state=active].hover-tab-trigger { background-color: var(--primary); color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-weight: 500; }
        .tabs-list-container { background-color: #e5e7eb; padding: 0.25rem; border-radius: 0.5rem; }
        html.dark .tabs-list-container { background-color: #374151; }
        .hover-image-card { transition: transform 0.3s ease-out, box-shadow 0.3s ease-out; }
        .hover-image-card:hover { transform: scale(1.02) translateZ(3px); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15); }
        .hover-message, .hover-ai-message { transition: transform 0.2s ease-out, box-shadow 0.2s ease-out; max-width: 85%; }
        .hover-message:hover, .hover-ai-message:hover { transform: translateY(-2px) translateZ(2px); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(var(--primary-rgb), 0.05); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.3); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(var(--primary-rgb), 0.5); }
        .prose { /* ... prose styles ... */ }
        .dark .prose { /* ... dark prose styles ... */ }
        .fade-in-title { opacity: 0; transform: translateY(-10px); transition: opacity 0.5s ease-out, transform 0.5s ease-out; }
        .fade-in-title.visible { opacity: 1; transform: translateY(0); }
        .fade-in-content { opacity: 0; transition: opacity 0.4s ease-out; }
        .fade-in-content.visible { opacity: 1; }
        `}</style>

      {/* Navigation and Title (unchanged) */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="gradient" size="sm" onClick={() => navigate('/tasks')} className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl">
           <svg className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
           Dashboard
         </Button>
         <Button variant="gradient" size="sm" onClick={() => navigate('/')} className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl">
           <Home className="h-4 w-4" /> Home
         </Button>
      </div>
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 p-6 rounded-xl mb-8 shadow-sm border border-black/5 dark:border-white/5">
           <h1 className={`text-2xl md:text-3xl font-bold mb-1 text-gray-800 dark:text-gray-100 ${titleFadeIn ? 'fade-in-title visible' : 'fade-in-title'}`}>Analysis History</h1>
           <p className="text-sm text-muted-foreground">Review past analyses, results, and associated chat discussions.</p>
       </div>

      {/* Filter Bar (unchanged) */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
               <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
                <Filter size={14} /> Filter
                {(filterOptions.taskTypes.length > 0 || filterOptions.dateRange.start || filterOptions.dateRange.end) && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary flex items-center justify-center text-[10px] font-semibold text-primary-foreground">{filterOptions.taskTypes.length + (filterOptions.dateRange.start || filterOptions.dateRange.end ? 1 : 0)}</span>}
              </Button>
            </PopoverTrigger>
             <PopoverContent className="w-72" align="start">{/* ... filter content unchanged ... */}</PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
           <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs" disabled={!selectedAnalysisData} onClick={handleExport}>
            <Download size={14} /> Export PDF
          </Button>
          {/* Optional: Re-enable Share button if needed */}
          {/* <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs" disabled={!selectedAnalysisData} onClick={() => setShareDialogOpen(true)}>
            <Share2 size={14} /> Share
          </Button> */}
        </div>
      </div>

      {/* Main Content: Loading, No Results, or Grid (unchanged) */}
      {loading ? ( /* ... loading spinner ... */ <div className="flex justify-center items-center h-64"><div className="relative"><div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div><div className="absolute inset-0 flex items-center justify-center"><Bone className="h-5 w-5 text-primary animate-pulse" /></div></div></div>
      ) : filteredAnalyses.length === 0 ? ( /* ... no results card ... */ <Card className="border shadow-sm hover-card transition-all rounded-xl border-dashed border-gray-300 dark:border-gray-700"><CardContent className="flex flex-col items-center justify-center py-16 px-6"><Filter className="h-12 w-12 text-muted-foreground/50 mb-4" /><h3 className="text-lg font-medium mb-2 text-center text-gray-700 dark:text-gray-300">No Matching Analyses Found</h3><p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">{analyses.length > 0 ? 'Adjust your filters or clear them to see all past analyses.' : 'You haven\'t performed any bone health analyses yet.'}</p>{analyses.length > 0 ? <Button onClick={clearFilters} size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover-scale transition-all text-white rounded-md text-xs px-4 py-1.5"><X className="mr-1.5 h-3.5 w-3.5" /> Clear Filters</Button> : <Button onClick={() => navigate('/tasks')} size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover-scale transition-all text-white rounded-md text-xs px-4 py-1.5"><Bone className="mr-1.5 h-3.5 w-3.5" /> Start New Analysis</Button>}</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Analyses List Card (unchanged) */}
           <Card className="col-span-1 border rounded-xl shadow-sm overflow-hidden hover-card transition-all">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 border-b border-blue-700/50 text-white"><CardTitle className="flex items-center text-base font-semibold"><Clock className="h-4 w-4 mr-2 text-white/90" />Past Analyses {filteredAnalyses.length !== analyses.length && `(${filteredAnalyses.length} / ${analyses.length})`}</CardTitle></CardHeader>
               <CardContent className="p-1.5"><div className="space-y-1 max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar pr-1">{filteredAnalyses.map(analysis => <div key={analysis.id} className={`p-2.5 rounded-md cursor-pointer transition-all hover-list-item ${selectedAnalysis === analysis.id ? 'active' : ''}`} onClick={() => handleSelectAnalysis(analysis.id)}><div className={`font-medium text-sm truncate ${selectedAnalysis === analysis.id ? 'text-primary' : 'text-gray-800 dark:text-gray-100'}`}>{analysis.task_name}</div><div className="text-xs mt-1 flex items-center text-muted-foreground space-x-1.5"><Calendar className="h-3 w-3" /><span>{new Date(analysis.created_at).toLocaleDateString()}</span><span className="text-gray-300 dark:text-gray-600">·</span><Clock className="h-3 w-3" /><span>{new Date(analysis.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div></div>)}</div></CardContent>
           </Card>

          {/* Analysis Details Card (unchanged structure, content uses updated selectedAnalysisData) */}
           <Card className="col-span-1 lg:col-span-2 border shadow-sm rounded-xl overflow-hidden hover-card transition-all">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 border-b border-blue-700/50 text-white"><CardTitle className="flex items-center text-base font-semibold">{selectedAnalysisData ? <><Bone className="h-4 w-4 mr-2 text-white/90" />{selectedAnalysisData.task_name}</> : 'Analysis Details'}</CardTitle></CardHeader>
               <CardContent className={`pt-4 p-4 md:p-5 ${contentFadeIn ? 'fade-in-content visible' : 'fade-in-content'}`}>
                 {selectedAnalysisData ? (
                   <Tabs defaultValue="results" className="w-full">
                      <TabsList className="mb-4 grid w-full grid-cols-2 tabs-list-container">
                       <TabsTrigger value="results" className="hover-tab-trigger">Analysis Results</TabsTrigger>
                       <TabsTrigger value="chat" className="hover-tab-trigger">Chat History</TabsTrigger>
                     </TabsList>
                     <TabsContent value="results" className="space-y-4 max-h-[calc(100vh-370px)] overflow-y-auto custom-scrollbar pr-2 -mr-1">
                       {selectedAnalysisData.image_url ? (
                         <div className="mb-5 border rounded-lg p-3 hover-image-card transition-all overflow-hidden bg-gray-50 dark:bg-gray-800/50 shadow-sm">
                           <h3 className="font-medium text-sm mb-2 flex items-center text-gray-700 dark:text-gray-300"><svg className="h-4 w-4 mr-1.5 text-primary/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>Analyzed Image</h3>
                           <div className="flex justify-center"><img src={selectedAnalysisData.image_url} alt="Analyzed bone" className="max-h-52 md:max-h-60 object-contain rounded-md cursor-pointer transition-transform hover:scale-[1.03]" onClick={() => window.open(selectedAnalysisData.image_url, '_blank')} /></div>
                         </div>
                       ) : ( // Display placeholder if no image URL
                         <div className="mb-5 border border-dashed rounded-lg p-4 flex items-center justify-center text-muted-foreground bg-gray-50 dark:bg-gray-800/50 shadow-sm min-h-[100px]">
                           <ImageOff className="h-6 w-6 mr-2 opacity-50" />
                           <span>No image available for this analysis</span>
                         </div>
                       )}
                       {/* Use resultsDisplayRef for the display div, not for PDF generation */}
                        <div ref={resultsDisplayRef} className="prose dark:prose-invert max-w-none">
                         {formatResults(selectedAnalysisData.result_text)}
                       </div>
                     </TabsContent>
                     <TabsContent value="chat" className="max-h-[calc(100vh-370px)] overflow-y-auto custom-scrollbar pr-2 -mr-1">
                        {/* Chat history rendering (unchanged) */}
                        {chatInteractions[selectedAnalysisData.id]?.length > 0 ? <div className="space-y-4">{chatInteractions[selectedAnalysisData.id].map(chat => <div key={chat.id} className="space-y-2 text-sm"><div className="flex justify-end group"><div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-2.5 rounded-lg rounded-tr-none hover-message transition-all shadow-md relative">{chat.user_message}<div className="text-xs text-blue-200/80 pt-1 text-right">{new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div></div><div className="flex justify-start group"><div className="bg-gray-100 dark:bg-gray-700 p-2.5 rounded-lg rounded-tl-none hover-ai-message transition-all shadow-md relative text-gray-800 dark:text-gray-100">{chat.ai_response}<div className="text-xs text-gray-400 dark:text-gray-500 pt-1 text-left">{new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div></div></div>)}</div> : <div className="text-center py-10 px-4"><div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 mb-3"><svg className="h-6 w-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></div><p className="text-sm text-muted-foreground mb-4">No chat interactions recorded for this analysis.</p><Button variant="outline" size="sm" className="mt-2 hover-scale transition-all text-xs px-3 py-1 h-auto" onClick={() => navigate(`/analysis/${selectedAnalysisData.task_id}?analysisId=${selectedAnalysisData.id}`)}>Discuss Results <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button></div>}
                     </TabsContent>
                   </Tabs>
                 ) : (
                   <div className="flex justify-center items-center h-64 text-muted-foreground text-sm">Select an analysis from the list to view details.</div>
                 )}
               </CardContent>
           </Card>
        </div>
      )}

      {/* Share Dialog (unchanged) */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-lg">Share Analysis Results</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-1.5"><Label htmlFor="email" className="text-xs font-medium">Email address</Label><Input id="email" type="email" placeholder="recipient@example.com" value={shareEmail} onChange={e => setShareEmail(e.target.value)} className="h-9 text-sm" /></div>
             <div className="space-y-1.5"><Label htmlFor="note" className="text-xs font-medium">Add a note (optional)</Label><Textarea id="note" placeholder="Include a brief message..." value={shareNote} onChange={e => setShareNote(e.target.value)} className="text-sm min-h-[60px]" rows={3} /></div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShareDialogOpen(false)}>Cancel</Button>
            <Button type="button" size="sm" onClick={handleShare} disabled={!shareEmail || !/\S+@\S+\.\S+/.test(shareEmail)} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90 disabled:opacity-50">Share Analysis</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnalysisHistory;
