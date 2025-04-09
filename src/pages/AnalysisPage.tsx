import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Home, Download, Maximize, Minimize, Eye, ZoomIn, ZoomOut, ArrowLeft, UserRound, ExternalLink } from 'lucide-react'; // Added ExternalLink
import ChatbotButton from '@/components/ChatbotButton';
import { motion } from 'framer-motion';
import { AuroraBackground } from '@/components/ui/aurora-background';
// Import Dialog components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose, // If using manual close
  DialogTrigger, // If using trigger
} from "@/components/ui/dialog";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Constants ---
const TASK_TITLES: Record<string, string> = {
  'fracture-detection': 'Bone Fracture Detection',
  'bone-marrow': 'Bone Marrow Cell Classification',
  'osteoarthritis': 'Knee Joint Osteoarthritis Detection',
  'osteoporosis': 'Osteoporosis Stage & BMD Score',
  'bone-age': 'Bone Age Detection',
  'spine-fracture': 'Cervical Spine Fracture Detection',
  'bone-tumor': 'Bone Tumor/Cancer Detection',
  'bone-infection': 'Bone Infection (Osteomyelitis) Detection'
};

const TASK_GUIDANCE: Record<string, string> = {
  'fracture-detection': 'Upload an X-ray image of the bone area. The image should clearly show the suspected fracture area.',
  'bone-marrow': 'Upload a microscope image of the bone marrow sample.',
  'osteoarthritis': 'Upload an X-ray or MRI image of the knee joint.',
  'osteoporosis': 'Upload a DEXA scan or X-ray image of the spine, hip, or wrist.',
  'bone-age': 'Upload an X-ray image of the hand and wrist.',
  'spine-fracture': 'Upload an X-ray, CT scan or MRI image of the cervical spine.',
  'bone-tumor': 'Upload an X-ray, MRI, or CT scan showing the suspected area.',
  'bone-infection': 'Upload an X-ray, MRI, or bone scan showing the affected area.'
};

// Using the refined specialist list
const TASK_SPECIALISTS: Record<string, string> = {
    'fracture-detection': 'Orthopedic Surgeon',
    'bone-marrow': 'Hematologist',
    'osteoarthritis': 'Rheumatologist',
    'osteoporosis': 'Endocrinologist', // or Rheumatologist
    'bone-age': 'Pediatric Endocrinologist',
    'spine-fracture': 'Spine Surgeon', // Orthopedic or Neurosurgeon
    'bone-tumor': 'Orthopedic Oncologist',
    'bone-infection': 'Orthopedic Surgeon', // In collaboration with Infectious Disease Specialist
};
// --- End of Constants ---

const AnalysisPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [storedImageUrl, setStoredImageUrl] = useState<string | null>(null);
  const [isResultsMaximized, setIsResultsMaximized] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isImageModalMaximized, setIsImageModalMaximized] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [titleFadeIn, setTitleFadeIn] = useState(false);
  const [showConsultDialog, setShowConsultDialog] = useState(false); // State for consult dialog

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setTimeout(() => setTitleFadeIn(true), 100);
  }, [user, navigate]);

  useEffect(() => {
    if (taskId && !TASK_TITLES[taskId]) {
      toast.error('Invalid analysis task');
      navigate('/tasks');
    }
  }, [taskId, navigate]);

  // --- Functions ---
    const handleImageUpload = (file: File) => {
        setImage(file);
        setImageUrl(URL.createObjectURL(file));
        setResults(null);
        setError(null);
        setAnalysisId(null);
        setStoredImageUrl(null);
        setIsImageModalOpen(false);
        setIsImageModalMaximized(false);
        setZoomLevel(1);
        setShowConsultDialog(false); // Reset dialog on new upload

        const reader = new FileReader();
        reader.onloadend = () => {
            setImageBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyze = async () => {
        if (!image || !imageBase64 || !taskId || !user) {
            toast.error('Please upload an image first');
            return;
        }

        setAnalyzing(true);
        setError(null);
        setResults(null);
        setShowConsultDialog(false); // Reset dialog

        const toastId = toast.loading('Analyzing image, please wait...');

        try {
            console.log("Sending image for analysis...");

            const { data, error: functionError } = await supabase.functions.invoke('analyze-bone-image', {
                body: {
                image: imageBase64,
                taskId,
                userType: user.userType === 'doctor' ? 'doctor' : 'common',
                userId: user.id
                }
            });

            if (functionError) {
                console.error('Function invocation error:', functionError);
                throw new Error(`Analysis service failed: ${functionError.message}`);
            }

            if (data?.error) {
                console.error('Function returned error:', data.error);
                throw new Error(data.error);
            }

            if (!data?.analysis) {
                console.error('No analysis content returned:', data);
                throw new Error('Analysis service did not return valid results.');
            }

            setResults(data.analysis);
            setAnalysisId(data.analysisId || null); // Store analysisId if available
            setStoredImageUrl(data.imageUrl || null); // Store image URL if available

            toast.success('Analysis complete!', { id: toastId });

        } catch (error) {
            console.error('Analysis error:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            setError(`Failed to analyze image. ${errorMessage}. Please try again or use a different image.`);
            toast.error(`Analysis failed: ${errorMessage}`, { id: toastId });
        } finally {
            setAnalyzing(false);
        }
    };

    // --- Enhanced PDF Download Function ---
    const handleDownloadResults = async () => {
        if (!results || !resultsRef.current) {
            toast.warning('No results available to download.');
            return;
        }

        const toastId = toast.loading('Generating PDF, please wait...');

        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true, // Enable compression
            });

            const taskTitle = TASK_TITLES[taskId || ''] || 'Bone Analysis';
            const analysisDate = new Date().toLocaleString();
            const userEmail = user?.email || 'N/A';
            const pageHeight = pdf.internal.pageSize.getHeight();
            const pageWidth = pdf.internal.pageSize.getWidth();
            const margin = 15; // mm

            // --- Helper Function for Headers/Footers ---
            const addHeaderFooter = (doc: jsPDF, pageNum: number, pageCount: number) => {
                doc.setFontSize(9);
                doc.setTextColor(120); // Gray color

                // Header
                doc.text(taskTitle, margin, margin - 5);
                doc.text(`User: ${userEmail}`, pageWidth - margin, margin - 5, { align: 'right' });
                doc.setDrawColor(200); // Light gray line
                doc.setLineWidth(0.2);
                doc.line(margin, margin, pageWidth - margin, margin); // Line below header

                // Footer
                doc.line(margin, pageHeight - margin, pageWidth - margin, pageHeight - margin); // Line above footer
                doc.text(`Page ${pageNum} of ${pageCount}`, pageWidth / 2, pageHeight - margin + 5, { align: 'center' });
                doc.text(`Generated: ${analysisDate}`, margin, pageHeight - margin + 5);
                doc.text('AI Analysis - Informational Only', pageWidth - margin, pageHeight - margin + 5, { align: 'right' });
            };

            // --- Cover Page ---
            pdf.setFontSize(22); pdf.setTextColor(0);
            pdf.text(taskTitle, pageWidth / 2, pageHeight / 2 - 30, { align: 'center' });
            pdf.setFontSize(16);
            pdf.text(`Analysis Report`, pageWidth / 2, pageHeight / 2 - 15, { align: 'center' });
            pdf.setFontSize(11); pdf.setTextColor(80);
            pdf.text(`User: ${userEmail}`, pageWidth / 2, pageHeight / 2 + 5, { align: 'center' });
            pdf.text(`Date: ${analysisDate}`, pageWidth / 2, pageHeight / 2 + 12, { align: 'center' });
            pdf.setFontSize(10); pdf.setTextColor(150);
            pdf.text('Powered by AI - For Informational Purposes Only', pageWidth / 2, pageHeight - 30, { align: 'center' });


            let currentPage = 1; // Start page count after cover

            // --- Add Image Page (if available) ---
            const imgSrc = storedImageUrl || imageUrl;
            if (imgSrc) {
                currentPage++;
                pdf.addPage();
                pdf.setFontSize(14); pdf.setTextColor(0);
                pdf.text('Analyzed Image', margin, margin + 10); // Title for image page

                try {
                    // Fetch image data to handle potential CORS issues and ensure embedding
                    const imgResponse = await fetch(imgSrc);
                    if (!imgResponse.ok) throw new Error(`Failed to fetch image: ${imgResponse.statusText}`);
                    const blob = await imgResponse.blob();
                    const reader = new FileReader();
                    const dataUrl = await new Promise<string>((resolve, reject) => {
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });

                    const imgProps = pdf.getImageProperties(dataUrl);
                    const imgMaxW = pageWidth - 2 * margin;
                    const imgMaxH = pageHeight - 2 * margin - 20; // Leave space for title/footer
                    const ratio = Math.min(imgMaxW / imgProps.width, imgMaxH / imgProps.height);
                    const imgW = imgProps.width * ratio;
                    const imgH = imgProps.height * ratio;
                    const xOffset = (pageWidth - imgW) / 2;
                    const yOffset = margin + 20; // Position below title

                    pdf.addImage(dataUrl, imgProps.fileType, xOffset, yOffset, imgW, imgH);

                } catch (imgError) {
                    console.error("PDF Export: Could not load or add image:", imgError);
                    toast.warning("PDF Export: Could not include image.", { id: toastId });
                    pdf.setFontSize(10); pdf.setTextColor(150);
                    pdf.text('[Error: Analyzed image could not be embedded]', margin, margin + 25);
                }
            }

            // --- Add Results Text using html2canvas ---
            const elementToRender = resultsRef.current;
            if (elementToRender) {
                currentPage++;
                pdf.addPage();
                pdf.setFontSize(14); pdf.setTextColor(0);
                pdf.text('Analysis Results', margin, margin + 10); // Title for results page

                const canvas = await html2canvas(elementToRender, {
                    scale: 2, // Higher scale for better resolution
                    logging: false,
                    useCORS: true, // Important if results contain external resources (unlikely here)
                    backgroundColor: '#ffffff', // Ensure solid background for canvas
                    // Capture full scrollable content
                    width: elementToRender.scrollWidth,
                    height: elementToRender.scrollHeight,
                    windowWidth: elementToRender.scrollWidth,
                    windowHeight: elementToRender.scrollHeight,
                });

                const imgData = canvas.toDataURL('image/png', 0.95); // Use PNG with slight compression
                const imgProps = pdf.getImageProperties(imgData);
                const contentWidth = pageWidth - 2 * margin;
                const contentHeight = (imgProps.height * contentWidth) / imgProps.width;

                let heightLeft = contentHeight;
                let position = margin + 20; // Start below title
                const pageContentHeight = pageHeight - 2 * margin - 20; // Available height per page

                // Add the first chunk
                pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
                heightLeft -= pageContentHeight;

                // Add subsequent pages if needed
                while (heightLeft > 0) {
                    currentPage++;
                    position = -contentHeight + heightLeft + pageContentHeight; // Calculate Y offset for the image on new page
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', margin, margin + 10, contentWidth, contentHeight); // Add image starting from top content area
                    heightLeft -= pageContentHeight;
                }
            } else {
                // Add a page indicating no results text if element is missing (shouldn't happen if results exist)
                currentPage++;
                pdf.addPage();
                pdf.setFontSize(10); pdf.setTextColor(150);
                pdf.text('Analysis results content could not be rendered.', margin, margin + 10);
            }

            // --- Add Headers/Footers to all pages ---
            const totalPages = currentPage;
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                // Don't add header/footer to cover page (page 1)
                if (i > 1) {
                    addHeaderFooter(pdf, i - 1, totalPages - 1); // Adjust page numbers for content pages
                }
            }

            // --- Save ---
            const fileName = `${taskTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
            toast.success('PDF downloaded successfully!', { id: toastId });

        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF. See console for details.', { id: toastId });
        }
    };

    // Function to handle opening the maps link (called from dialog)
    const proceedToConsultation = () => {
        if (!taskId) return;
        const specialistType = TASK_SPECIALISTS[taskId] || 'medical specialist'; // Fallback
        const searchTerm = encodeURIComponent(`${specialistType} near me`); // Search "near me"
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchTerm}`;

        // Try to get geolocation for potentially better results
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    // Google Maps doesn't directly use lat/lng in search URL easily anymore,
                    // but 'near me' often leverages browser location if permitted.
                    // The @@lat,lng syntax is more for direct map view centering.
                    window.open(mapsUrl, '_blank');
                },
                () => {
                    // Geolocation failed or denied
                    window.open(mapsUrl, '_blank');
                    toast.info("Could not get precise location. Searching based on 'near me'.");
                },
                { timeout: 5000 } // Add a timeout
            );
        } else {
            // Geolocation not supported
            window.open(mapsUrl, '_blank');
            toast.info("Geolocation not supported. Searching based on 'near me'.");
        }
        setShowConsultDialog(false); // Close dialog after proceeding
    };


    const openImageModal = () => setIsImageModalOpen(true);
    const closeImageModal = () => { setIsImageModalOpen(false); setIsImageModalMaximized(false); setZoomLevel(1); };
    const toggleImageModalMaximize = () => setIsImageModalMaximized(!isImageModalMaximized);
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));

    // Using the enhanced formatResults from previous step
    const formatResults = (resultsText: string | null): React.ReactNode => {
        if (!resultsText) return <p className="text-muted-foreground">No results text available.</p>;
        try {
            const normalizedText = resultsText.replace(/\r\n/g, '\n').replace(/ +\n/g, '\n').trim();
            const textWithoutCodeBlocks = normalizedText.replace(/```[\s\S]*?```/g, '[Code Block Removed]');
            const blocks = textWithoutCodeBlocks.split(/(\n\n+|\n(?=[*\-•#\d+\.\s]))/).filter(block => block && block.trim() !== '');

            return (
                <div className="space-y-3 leading-relaxed">
                    {blocks.map((block, index) => {
                        const trimmedBlock = block.trim();
                        const headingMatch = trimmedBlock.match(/^(#{1,5})\s+(.*)/);
                        if (headingMatch) {
                            const level = headingMatch[1].length; const text = headingMatch[2];
                            const Tag = `h${level + 1}` as keyof JSX.IntrinsicElements;
                            const textSize = ['text-xl', 'text-lg', 'text-md', 'text-md', 'text-md'][level -1] || 'text-base';
                            return <Tag key={index} className={`${textSize} font-semibold mt-4 mb-1 text-primary/90 border-b pb-1`}>{text}</Tag>;
                        }
                        const keywordHeadingMatch = trimmedBlock.match(/^(Summary|Findings|Interpretation|Recommendations|Assessment|Diagnosis|Conclusion|Analysis Results)\s*[:*]?(.*)/i);
                        if (keywordHeadingMatch) {
                            const text = (keywordHeadingMatch[2] && keywordHeadingMatch[2].trim()) ? keywordHeadingMatch[2].trim() : keywordHeadingMatch[1];
                            return <h3 key={index} className="text-lg font-semibold mt-4 mb-1 text-primary/90 border-b pb-1">{text}</h3>;
                        }
                        if (trimmedBlock.match(/^[*•-]\s+/)) {
                            const listItems = trimmedBlock.split('\n').map(line => line.trim().replace(/^[*•-]\s+/, ''));
                            return ( <ul key={index} className="list-disc pl-5 space-y-1"> {listItems.filter(item => item).map((item, i) => ( <li key={i} className="text-gray-700 dark:text-gray-300 text-sm" dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<em>$1</em>') }} /> ))} </ul> );
                        }
                        if (trimmedBlock.match(/^\d+\.\s+/)) {
                            const listItems = trimmedBlock.split('\n').map(line => line.trim().replace(/^\d+\.\s+/, ''));
                            return ( <ol key={index} className="list-decimal pl-5 space-y-1"> {listItems.filter(item => item).map((item, i) => ( <li key={i} className="text-gray-700 dark:text-gray-300 text-sm" dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<em>$1</em>') }} /> ))} </ol> );
                        }
                        return <p key={index} className="text-gray-700 dark:text-gray-300 text-sm" dangerouslySetInnerHTML={{ __html: trimmedBlock.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<em>$1</em>') }} />;
                    })}
                </div>
            );
        } catch (e) { console.error("Error formatting results:", e); return <pre className="whitespace-pre-wrap text-sm">{resultsText}</pre>; }
    };
  // --- End of Functions ---

  if (!taskId || !user) return null;

  const taskTitle = TASK_TITLES[taskId] || 'Unknown Analysis';
  const taskGuidance = TASK_GUIDANCE[taskId] || 'Please upload an appropriate medical image for analysis.';
  const specialistType = TASK_SPECIALISTS[taskId] || 'medical specialist';

  const fadeIn = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };

  return (
    <AuroraBackground showRadialGradient={true}>
      <div className="container mx-auto px-4 py-12 ">
         <style>
            {`
            .hover-scale { transition: transform 0.2s ease-out; }
            .hover-scale:hover { transform: scale(1.05); }
            .fade-in-title { opacity: 0; transform: translateY(-10px); transition: opacity 0.5s ease-out, transform 0.5s ease-out; }
            .fade-in-title.visible { opacity: 1; transform: translateY(0); }
            .animate-fade-in { animation: fadeInAnimation 0.5s ease-out forwards; }
            @keyframes fadeInAnimation { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            /* Ensure prose styles don't override parent text color for PDF */
            .prose p, .prose li, .prose h1, .prose h2, .prose h3, .prose h4, .prose strong { color: inherit; }
            `}
         </style>
        {/* --- Back and Home Buttons --- */}
        <motion.div className="flex justify-between items-center mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} >
          <Button variant="gradient" onClick={() => navigate('/bone-analysis')} className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl" >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tasks
          </Button>
          <div className="flex items-center gap-2">
             <Button variant="gradient" onClick={() => navigate('/')} className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl" >
                <Home className="mr-2 h-4 w-4" /> Home
             </Button>
          </div>
        </motion.div>

        {/* --- Page Title Block --- */}
        <div className={`bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-6 rounded-2xl mb-8 ${titleFadeIn ? 'fade-in-title visible' : 'fade-in-title'}`}>
          <h1 className="text-3xl font-bold mb-2">{taskTitle}</h1>
          <p className="text-muted-foreground"> {user.userType === 'doctor' ? 'AI-assisted analysis for clinical evaluation' : 'AI-powered analysis for informational purposes only'} </p>
        </div>

        {/* --- Main Content Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* --- Image Upload Card --- */}
          <motion.div variants={fadeIn} initial="hidden" animate="visible" className="animate-fade-in">
             <Card className="border transition-all duration-300 hover:shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-primary-foreground rounded-t-lg">
                   <CardTitle className="text-lg font-semibold text-primary-foreground">Upload Medical Image</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                   <p className="text-sm text-muted-foreground mb-6">{taskGuidance}</p>
                   <ImageUpload onImageSelected={handleImageUpload} imageUrl={imageUrl} isLoading={analyzing} />
                   <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
                      {imageUrl && ( <Button variant="outline" onClick={openImageModal} className="flex-1 sm:flex-none hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-lg border-primary/50 text-primary hover:bg-primary/10" > <Eye className="mr-2 h-4 w-4" /> View Image </Button> )}
                      <Button onClick={handleAnalyze} disabled={!image || analyzing} className="flex-1 sm:flex-none hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white" >
                         {analyzing ? ( <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing... </> ) : 'Analyze Image'}
                      </Button>
                   </div>
                </CardContent>
             </Card>
          </motion.div>

          {/* --- Analysis Results Card --- */}
           <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className={`animate-fade-in ${isResultsMaximized ? 'fixed inset-0 z-50 overflow-hidden bg-background' : ''}`}>
             <Card className={`border transition-all duration-300 ${isResultsMaximized ? 'h-full w-full rounded-none shadow-none border-none' : 'hover:shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg overflow-hidden'}`}>
                <CardHeader className={`flex flex-row items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600 text-primary-foreground ${isResultsMaximized ? '' : 'rounded-t-lg'} ${isResultsMaximized ? 'sticky top-0 z-10' : ''}`}>
                   <CardTitle className="text-lg font-semibold text-primary-foreground">Analysis Results</CardTitle>
                   <div className="flex items-center space-x-1">
                      {results && ( <Button variant="outline" size="sm" onClick={handleDownloadResults} className="flex items-center gap-1 hover-scale transition-all duration-300 hover:shadow-md active:scale-95 rounded-lg bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs px-2 py-1 h-auto" > <Download size={14} /> PDF </Button> )}
                      <Button variant="ghost" size="icon" onClick={() => setIsResultsMaximized(!isResultsMaximized)} className="transition-all duration-300 hover:shadow-md active:scale-95 rounded-lg text-white hover:bg-white/20 w-8 h-8" > {isResultsMaximized ? <Minimize size={16} /> : <Maximize size={16} />} </Button>
                   </div>
                </CardHeader>
                 <CardContent className={`p-6 ${isResultsMaximized ? 'h-[calc(100vh-4rem)] overflow-y-auto' : 'min-h-[200px] max-h-[60vh] overflow-y-auto'} ${isResultsMaximized ? 'bg-background' : 'bg-white/95 dark:bg-gray-900/90 rounded-b-lg'}`}> {/* Adjusted height calculation and overflow */}
                   {results ? (
                     // The ref is crucial for PDF generation
                     <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none animate-fade-in text-gray-800 dark:text-gray-200" ref={resultsRef}>
                         {formatResults(results)}
                     </div>
                   ) : error ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-destructive animate-fade-in">
                         <p className="font-medium">Analysis Failed</p>
                         <p className="text-sm mt-1">{error}</p>
                      </div>
                   ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                         <p> {analyzing ? ( <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processing...</span> ) : 'Upload an image and click "Analyze Image" to view results.'} </p>
                      </div>
                   )}
                </CardContent>
             </Card>
          </motion.div>
        </div>

        {/* --- Chatbot and Consult Buttons (Appear After Results) --- */}
        {results && (
          <motion.div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} >
            <ChatbotButton analysisContext={results} taskTitle={taskTitle} analysisId={analysisId} className="rounded-lg w-full sm:w-auto" />
            {user.userType !== 'doctor' && (
               // Open the dialog when this button is clicked
              <Button variant="outline" onClick={() => setShowConsultDialog(true)} className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 rounded-lg border-primary/70 text-primary hover:bg-primary/10 w-full sm:w-auto" >
                <UserRound className="mr-2 h-4 w-4" />
                Consult a Specialist Near You
              </Button>
            )}
          </motion.div>
        )}

         {/* --- Consult Specialist Confirmation Dialog --- */}
        <Dialog open={showConsultDialog} onOpenChange={setShowConsultDialog}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserRound className="h-5 w-5 text-primary" />
                        Find a Specialist?
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        This will open Google Maps to search for a{' '}
                        <strong className="text-primary">{specialistType}</strong> near you.
                        <br /><br />
                        <span className="text-xs text-muted-foreground">
                            Disclaimer: This search is for informational purposes only and does not constitute a medical referral or endorsement. Always consult with a qualified healthcare provider for medical advice.
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 sm:justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowConsultDialog(false)}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={proceedToConsultation} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Proceed to Maps
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>


        {/* --- Image Modal (same as before) --- */}
        {isImageModalOpen && imageUrl && (
           <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity duration-300 ${isImageModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <motion.div className={`relative bg-white dark:bg-gray-900 shadow-2xl rounded-lg overflow-hidden flex flex-col ${isImageModalMaximized ? 'w-full h-full' : 'max-w-4xl w-full max-h-[90vh]'}`} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} >
                 <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700 flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Uploaded Image</h3>
                    <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="icon" onClick={handleZoomIn} className="text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 w-8 h-8"><ZoomIn size={18} /></Button>
                        <Button variant="ghost" size="icon" onClick={handleZoomOut} className="text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 w-8 h-8"><ZoomOut size={18} /></Button>
                        <Button variant="ghost" size="icon" onClick={toggleImageModalMaximize} className="text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 w-8 h-8">{isImageModalMaximized ? <Minimize size={18} /> : <Maximize size={18} />}</Button>
                        <Button variant="ghost" size="icon" onClick={closeImageModal} className="text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 w-8 h-8"><Minimize size={18} /></Button> {/* Changed Icon for Close */}
                    </div>
                 </div>
                 <div className="flex-grow p-4 overflow-auto flex items-center justify-center">
                    <img src={imageUrl} alt="Uploaded for analysis" className="max-w-full max-h-full object-contain transition-transform duration-200 ease-out block" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }} />
                 </div>
              </motion.div>
           </div>
        )}

      </div>
    </AuroraBackground>
  );
};

export default AnalysisPage;
