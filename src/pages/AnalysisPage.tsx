import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Home, Download, Maximize, Minimize, Eye, ZoomIn, ZoomOut, ArrowLeft, UserRound } from 'lucide-react';
import ChatbotButton from '@/components/ChatbotButton';
import { motion } from 'framer-motion';
import { AuroraBackground } from '@/components/ui/aurora-background';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Constants (TASK_TITLES, TASK_GUIDANCE, TASK_SPECIALISTS) remain the same ---
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

const TASK_SPECIALISTS: Record<string, string> = {
  'fracture-detection': 'orthopedic doctor',
  'bone-marrow': 'hematologist',
  'osteoarthritis': 'rheumatologist',
  'osteoporosis': 'endocrinologist',
  'bone-age': 'pediatric endocrinologist',
  'spine-fracture': 'spine surgeon',
  'bone-tumor': 'oncologist',
  'bone-infection': 'infectious disease specialist'
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

  // --- Functions (handleImageUpload, handleAnalyze, handleDownloadResults, handleConsultSpecialist, openImageModal, closeImageModal, toggleImageModalMaximize, handleZoomIn, handleZoomOut, formatResults) remain the same ---
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

        try {
        console.log("Sending image for analysis...");

        const { data, error } = await supabase.functions.invoke('analyze-bone-image', {
            body: {
            image: imageBase64,
            taskId,
            userType: user.userType === 'doctor' ? 'doctor' : 'common',
            userId: user.id
            }
        });

        if (error) {
            console.error('Function error:', error);
            throw new Error(`Analysis failed: ${error.message}`);
        }

        if (data?.error) {
            console.error('Data error:', data.error);
            throw new Error(data.error);
        }

        setResults(data.analysis);

        if (data.analysisId) {
            setAnalysisId(data.analysisId);
        }

        if (data.imageUrl) {
            setStoredImageUrl(data.imageUrl);
        }

        toast.success('Analysis complete');
        } catch (error) {
        console.error('Analysis error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setError(`Failed to analyze image. ${errorMessage}. Please try again or try a different image.`);
        toast.error('Failed to analyze image. Please try again.');
        } finally {
        setAnalyzing(false);
        }
    };

    const handleDownloadResults = async () => {
        if (!results || !resultsRef.current) {
        toast.warn('No results to download.');
        return;
        }

        toast.info('Generating PDF...');
        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const taskTitle = TASK_TITLES[taskId || ''] || 'Bone Analysis';
            const analysisDate = new Date().toLocaleString();
            const userEmail = user?.email || 'N/A';

            const addHeaderFooter = (doc: jsPDF, pageNum: number, pageCount: number) => {
                const pageHeight = doc.internal.pageSize.getHeight();
                const pageWidth = doc.internal.pageSize.getWidth();
                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text(taskTitle, 20, 15);
                doc.text(`User: ${userEmail}`, pageWidth - 20, 15, { align: 'right' });
                doc.setDrawColor(200);
                doc.line(20, 18, pageWidth - 20, 18);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Page ${pageNum} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
                doc.text(`Generated: ${analysisDate}`, 20, pageHeight - 10);
                doc.text('AI-Powered Analysis - For Informational Purposes Only', pageWidth - 20, pageHeight - 10, { align: 'right' });
            };

            let currentPage = 1;
            const addPageWithHeaderFooter = () => {
                if (currentPage > 1) addHeaderFooter(pdf, currentPage - 1, 0);
                pdf.addPage();
                currentPage++;
            };

            pdf.setFontSize(24); pdf.setTextColor(0);
            pdf.text(taskTitle, pdf.internal.pageSize.getWidth() / 2, 60, { align: 'center' });
            pdf.setFontSize(14);
            pdf.text(`Analysis Report`, pdf.internal.pageSize.getWidth() / 2, 75, { align: 'center' });
            pdf.setFontSize(12);
            pdf.text(`User: ${userEmail}`, pdf.internal.pageSize.getWidth() / 2, 90, { align: 'center' });
            pdf.text(`Date: ${analysisDate}`, pdf.internal.pageSize.getWidth() / 2, 100, { align: 'center' });

            if (imageUrl || storedImageUrl) {
                addPageWithHeaderFooter();
                pdf.setFontSize(16); pdf.setTextColor(0);
                pdf.text('Analyzed Image', 20, 30);
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = storedImageUrl || imageUrl || '';

                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = (e) => { console.error("Image load error:", e); toast.error("PDF Export: Could not load image."); reject(e); };
                });

                const pageWidth = pdf.internal.pageSize.getWidth(); const pageHeight = pdf.internal.pageSize.getHeight();
                const maxImgWidth = pageWidth - 40; const maxImgHeight = pageHeight - 60;
                let imgWidth = img.width; let imgHeight = img.height; let ratio = 1;

                if (imgWidth > maxImgWidth) { ratio = maxImgWidth / imgWidth; imgWidth = maxImgWidth; imgHeight *= ratio; }
                if (imgHeight > maxImgHeight) { ratio = maxImgHeight / imgHeight; imgHeight = maxImgHeight; imgWidth *= ratio; }

                const xOffset = (pageWidth - imgWidth) / 2; const yOffset = 40;
                try { pdf.addImage(img, 'JPEG', xOffset, yOffset, imgWidth, imgHeight); }
                catch (e) { console.error("jsPDF addImage error:", e); toast.error("Failed to add image to PDF."); pdf.text("Error: Could not embed image.", xOffset, yOffset + 10); }
            }

            addPageWithHeaderFooter();
            pdf.setFontSize(16); pdf.setTextColor(0);
            pdf.text('Analysis Results', 20, 30);

            const elementToRender = resultsRef.current;
            const MARGIN = 20; const PAGE_WIDTH = pdf.internal.pageSize.getWidth() - MARGIN * 2; const PAGE_HEIGHT = pdf.internal.pageSize.getHeight() - 40;
            const canvas = await html2canvas(elementToRender, { scale: 2, logging: false, useCORS: true, backgroundColor: null });
            const imgData = canvas.toDataURL('image/png'); const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = PAGE_WIDTH; const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            let heightLeft = pdfHeight; let position = 40;

            pdf.addImage(imgData, 'PNG', MARGIN, position, pdfWidth, pdfHeight); heightLeft -= PAGE_HEIGHT;

            while (heightLeft > 0) {
                position = heightLeft - pdfHeight + 40; addPageWithHeaderFooter();
                pdf.addImage(imgData, 'PNG', MARGIN, position, pdfWidth, pdfHeight); heightLeft -= PAGE_HEIGHT;
            }

            const totalPages = currentPage - 1;
            for (let i = 1; i <= totalPages; i++) { pdf.setPage(i); addHeaderFooter(pdf, i, totalPages); }

            const fileName = `${taskTitle.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName); toast.success('PDF downloaded successfully');

        } catch (error) { console.error('Error generating PDF:', error); toast.error('Failed to generate PDF.'); }
    };

    const handleConsultSpecialist = () => {
        if (!taskId) return;
        const specialistType = TASK_SPECIALISTS[taskId] || 'orthopedic doctor';
        if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(specialistType)}/@@${latitude},${longitude},14z`;
            window.open(mapsUrl, '_blank');
        }, () => {
            const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(specialistType)}`;
            window.open(mapsUrl, '_blank');
            toast.info("Could not get location. Searching nationwide.");
        });
        } else {
        const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(specialistType)}`;
        window.open(mapsUrl, '_blank');
        toast.info("Geolocation not supported. Searching nationwide.");
        }
    };

    const openImageModal = () => setIsImageModalOpen(true);
    const closeImageModal = () => { setIsImageModalOpen(false); setIsImageModalMaximized(false); setZoomLevel(1); };
    const toggleImageModalMaximize = () => setIsImageModalMaximized(!isImageModalMaximized);
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));

    const formatResults = (resultsText: string): React.ReactNode => {
        if (!resultsText) return null;
        const lines = resultsText.split('\n');
        const formattedElements: React.ReactNode[] = []; let currentListItems: string[] = []; let listType: 'bullet' | 'numbered' | null = null;
        const flushList = () => {
            if (currentListItems.length > 0) {
                const ListComponent = listType === 'numbered' ? 'ol' : 'ul';
                formattedElements.push( <ListComponent key={`list-${formattedElements.length}`} className={`list-${listType === 'numbered' ? 'decimal' : 'disc'} pl-6 space-y-1 my-3`}> {currentListItems.map((item, i) => ( <li key={i} dangerouslySetInnerHTML={{ __html: item }} /> ))} </ListComponent> );
                currentListItems = []; listType = null;
            }
        };
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('### ')) { flushList(); formattedElements.push(<h4 key={index} className="text-lg font-semibold mt-4 mb-2" dangerouslySetInnerHTML={{ __html: trimmedLine.substring(4) }} />); }
            else if (trimmedLine.startsWith('## ')) { flushList(); formattedElements.push(<h3 key={index} className="text-xl font-semibold mt-5 mb-2 border-b pb-1" dangerouslySetInnerHTML={{ __html: trimmedLine.substring(3) }} />); }
            else if (trimmedLine.startsWith('# ')) { flushList(); formattedElements.push(<h2 key={index} className="text-2xl font-bold mt-6 mb-3 border-b-2 pb-1" dangerouslySetInnerHTML={{ __html: trimmedLine.substring(2) }} />); }
            else if (trimmedLine.match(/^\*\*(Summary|Findings|Interpretation|Recommendations|Assessment|Diagnosis|Conclusion):\*\*/i)) { flushList(); const headingText = trimmedLine.replace(/^\*\*/, '').replace(/:\*\*/, ''); formattedElements.push(<h3 key={index} className="text-xl font-semibold mt-5 mb-2 border-b pb-1">{headingText}:</h3>); }
            else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) { if (listType !== 'bullet') flushList(); listType = 'bullet'; currentListItems.push(trimmedLine.substring(2)); }
            else if (trimmedLine.match(/^\d+\.\s/)) { if (listType !== 'numbered') flushList(); listType = 'numbered'; currentListItems.push(trimmedLine.replace(/^\d+\.\s/, '')); }
            else if (trimmedLine) { flushList(); formattedElements.push(<p key={index} className="my-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />); }
            else { flushList(); }
        });
        flushList();
        return <div className="space-y-2">{formattedElements}</div>;
    };
  // --- End of Functions ---

  if (!taskId || !user) return null;

  const taskTitle = TASK_TITLES[taskId] || 'Unknown Analysis';
  const taskGuidance = TASK_GUIDANCE[taskId] || 'Please upload an appropriate medical image for analysis.';

  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

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
             .prose p, .prose li, .prose h1, .prose h2, .prose h3, .prose h4, .prose strong { color: inherit; }
            `}
         </style>
        {/* --- Back and Home Buttons --- */}
        <motion.div
          className="flex justify-between items-center mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="gradient"
            onClick={() => navigate('/bone-analysis')}
            className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
          <div className="flex items-center gap-2">
             <Button
                variant="gradient"
                onClick={() => navigate('/')}
                className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl"
             >
                <Home className="mr-2 h-4 w-4" />
                Home
             </Button>
          </div>
        </motion.div>

        {/* --- Page Title Block --- */}
        <div className={`bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-6 rounded-2xl mb-8 ${titleFadeIn ? 'fade-in-title visible' : 'fade-in-title'}`}>
          <h1 className="text-3xl font-bold mb-2">
            {taskTitle}
          </h1>
          <p className="text-muted-foreground">
            {user.userType === 'doctor' ?
              'AI-assisted analysis for clinical evaluation' :
              'AI-powered analysis for informational purposes only'}
          </p>
        </div>

        {/* --- Main Content Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* --- Image Upload Card --- */}
          <motion.div variants={fadeIn} initial="hidden" animate="visible" className="animate-fade-in">
             {/* Apply the gradient style here */}
             <Card className="border transition-all duration-300 hover:shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-primary-foreground rounded-t-lg"> {/* <<<< MODIFIED STYLE */}
                   <CardTitle className="text-lg font-semibold text-primary-foreground">Upload Medical Image</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                   <p className="text-sm text-muted-foreground mb-6">{taskGuidance}</p>
                   <ImageUpload
                      onImageSelected={handleImageUpload}
                      imageUrl={imageUrl}
                      isLoading={analyzing}
                   />
                   <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
                      {imageUrl && (
                         <Button
                            variant="outline"
                            onClick={openImageModal}
                            className="flex-1 sm:flex-none hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-lg border-primary/50 text-primary hover:bg-primary/10"
                         >
                            <Eye className="mr-2 h-4 w-4" />
                            View Image
                         </Button>
                      )}
                      <Button
                         onClick={handleAnalyze}
                         disabled={!image || analyzing}
                         className="flex-1 sm:flex-none hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white" // Keep analyze button gradient
                      >
                         {analyzing ? ( <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing... </> ) : 'Analyze Image'}
                      </Button>
                   </div>
                </CardContent>
             </Card>
          </motion.div>

          {/* --- Analysis Results Card --- */}
           <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className={`animate-fade-in ${isResultsMaximized ? 'fixed inset-0 z-50 overflow-hidden' : ''}`}>
             {/* Apply the gradient style here */}
             <Card className={`border transition-all duration-300 ${isResultsMaximized ? 'h-full w-full rounded-none shadow-2xl' : 'hover:shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg overflow-hidden'}`}>
                <CardHeader className={`flex flex-row items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600 text-primary-foreground ${isResultsMaximized ? '' : 'rounded-t-lg'}`}> {/* <<<< MODIFIED STYLE */}
                   <CardTitle className="text-lg font-semibold text-primary-foreground">Analysis Results</CardTitle>
                   <div className="flex items-center space-x-1">
                      {results && (
                         <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadResults}
                             // Adjusted button style for better contrast on gradient
                            className="flex items-center gap-1 hover-scale transition-all duration-300 hover:shadow-md active:scale-95 rounded-lg bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs px-2 py-1 h-auto"
                         >
                            <Download size={14} />
                            PDF
                         </Button>
                      )}
                      <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => setIsResultsMaximized(!isResultsMaximized)}
                          // Adjusted button style for better contrast on gradient
                         className="transition-all duration-300 hover:shadow-md active:scale-95 rounded-lg text-white hover:bg-white/20 w-8 h-8"
                      >
                         {isResultsMaximized ? <Minimize size={16} /> : <Maximize size={16} />}
                      </Button>
                   </div>
                </CardHeader>
                <CardContent className={`p-6 ${isResultsMaximized ? 'h-[calc(100%-4rem)] overflow-y-auto' : 'min-h-[200px]'} bg-white/95 dark:bg-gray-900/90 ${isResultsMaximized ? '' : 'rounded-b-lg'}`}> {/* Adjusted height calc */}
                   {results ? (
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
                         <p>
                            {analyzing ? ( <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processing...</span> ) : 'Upload an image and click "Analyze Image" to view results.'}
                         </p>
                      </div>
                   )}
                </CardContent>
             </Card>
          </motion.div>
        </div>

        {/* --- Chatbot and Consult Buttons (Appear After Results) --- */}
        {results && (
          <motion.div
            className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <ChatbotButton
              analysisContext={results}
              taskTitle={taskTitle}
              analysisId={analysisId}
              className="rounded-lg w-full sm:w-auto"
            />
            {user.userType !== 'doctor' && (
              <Button
                variant="outline"
                onClick={handleConsultSpecialist}
                className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 rounded-lg border-primary/70 text-primary hover:bg-primary/10 w-full sm:w-auto"
              >
                <UserRound className="mr-2 h-4 w-4" />
                Consult a Specialist Near You
              </Button>
            )}
          </motion.div>
        )}

        {/* --- Image Modal --- */}
        {isImageModalOpen && imageUrl && (
           <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity duration-300 ${isImageModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <motion.div
                 className={`relative bg-white dark:bg-gray-900 shadow-2xl rounded-lg overflow-hidden flex flex-col ${isImageModalMaximized ? 'w-full h-full' : 'max-w-4xl w-full max-h-[90vh]'}`}
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.9, opacity: 0 }}
                 transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                 <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700 flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Uploaded Image</h3>
                    <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="icon" onClick={handleZoomIn} className="text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 w-8 h-8"><ZoomIn size={18} /></Button>
                        <Button variant="ghost" size="icon" onClick={handleZoomOut} className="text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 w-8 h-8"><ZoomOut size={18} /></Button>
                        <Button variant="ghost" size="icon" onClick={toggleImageModalMaximize} className="text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 w-8 h-8">{isImageModalMaximized ? <Minimize size={18} /> : <Maximize size={18} />}</Button>
                        <Button variant="ghost" size="icon" onClick={closeImageModal} className="text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 w-8 h-8"><Minimize size={18} /></Button>
                    </div>
                 </div>
                 <div className="flex-grow p-4 overflow-auto flex items-center justify-center">
                    <img
                       src={imageUrl}
                       alt="Uploaded for analysis"
                       className="max-w-full max-h-full object-contain transition-transform duration-200 ease-out block"
                       style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                    />
                 </div>
              </motion.div>
           </div>
        )}

      </div>
    </AuroraBackground>
  );
};

export default AnalysisPage;
