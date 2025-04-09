import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Home, Download, Maximize, Minimize, Eye, ZoomIn, ZoomOut, ArrowLeft, UserRound, X } from 'lucide-react';
import ChatbotButton from '@/components/ChatbotButton';
import { motion } from 'framer-motion';
// Removed AuroraBackground import as we are using standard page bg
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- TASK LOOKUP DATA (Unchanged) ---
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
// --- END TASK LOOKUP DATA ---


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

  // --- EFFECTS (Unchanged) ---
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
     // Fade in title
    setTimeout(() => {
      setTitleFadeIn(true);
    }, 100);
  }, [user, navigate]);

  useEffect(() => {
    if (taskId && !TASK_TITLES[taskId]) {
      toast.error('Invalid analysis task');
      navigate('/tasks');
    }
  }, [taskId, navigate]);
  // --- END EFFECTS ---

  // --- HANDLERS (Mostly Unchanged) ---
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
        throw new Error(`Analysis failed: ${functionError.message}`);
      }

      if (data?.error) {
        console.error('Function returned error:', data.error);
        throw new Error(data.error);
      }

      const analysisResult = data?.analysis || data?.message;

      if (!analysisResult) {
          console.error('Unexpected response format:', data);
          throw new Error('Received unexpected response format from analysis function.');
      }


      setResults(analysisResult);

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
      toast.error(`Analysis failed: ${errorMessage}`);
    } finally {
      setAnalyzing(false);
    }
  };

 const handleDownloadResults = async () => { // Keeping PDF generation logic
    if (!results || !resultsRef.current) {
        toast.error("No results available to download.");
        return;
    }

    toast.info('Generating PDF...');
    const taskTitle = TASK_TITLES[taskId || ''] || 'Bone Analysis';
    const fileName = `${taskTitle.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
    });

    try {
        // Page 1: Title and Info
        pdf.setFontSize(18);
        pdf.setTextColor(0, 0, 0);
        pdf.text(taskTitle, 20, 20);
        pdf.setFontSize(12);
        pdf.text(`Analysis Date: ${new Date().toLocaleString()}`, 20, 30);
        if(user?.email) {
            pdf.text(`Patient/User ID: ${user.email}`, 20, 36);
        }
        pdf.setDrawColor(150, 150, 150);
        pdf.line(20, 42, 190, 42);

        let currentPageHeight = 50;
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;
        const contentWidth = pageWidth - 2 * margin;

        // Add Image if available
         const effectiveImageUrl = storedImageUrl || imageUrl;
         if (effectiveImageUrl) {
            pdf.addPage();
            pdf.setFontSize(14);
            pdf.text('Analyzed Image', margin, 20);
            try {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = effectiveImageUrl;
                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = (e) => reject(new Error('Failed to load image for PDF'));
                });

                const maxImgWidth = contentWidth;
                const maxImgHeight = pageHeight - 40;
                let imgWidth = img.width;
                let imgHeight = img.height;
                let ratio = 1;

                if (imgWidth > maxImgWidth) ratio = maxImgWidth / imgWidth;
                else if (imgHeight > maxImgHeight) ratio = maxImgHeight / imgHeight;

                imgWidth *= ratio;
                imgHeight *= ratio;

                const xOffset = (pageWidth - imgWidth) / 2;
                pdf.addImage(effectiveImageUrl, 'JPEG', xOffset, 30, imgWidth, imgHeight);
            } catch (imgError) {
                console.error("Error adding image to PDF:", imgError);
                 pdf.setPage(pdf.getNumberOfPages());
                pdf.setFontSize(10);
                pdf.setTextColor(255, 0, 0);
                pdf.text('Error: Could not load image for PDF.', margin, 30);
                pdf.setTextColor(0, 0, 0);
            }
            pdf.addPage();
            currentPageHeight = 30;
            pdf.setFontSize(16);
            pdf.text('Analysis Results', margin, 20);
            pdf.setDrawColor(150, 150, 150);
            pdf.line(margin, 23, pageWidth - margin, 23);
            currentPageHeight = 30;
        } else {
            pdf.setFontSize(16);
            pdf.text('Analysis Results', margin, currentPageHeight);
            pdf.setDrawColor(150, 150, 150);
            pdf.line(margin, currentPageHeight + 3, pageWidth - margin, currentPageHeight + 3);
            currentPageHeight += 10;
        }

        // Add Formatted Text Results
        const resultsElement = resultsRef.current;
        const canvas = await html2canvas(resultsElement, {
             scale: 2,
             logging: false,
             useCORS: true,
             backgroundColor: '#ffffff',
             onclone: (doc) => {
                 const allElements = doc.querySelectorAll('*');
                 allElements.forEach(el => {
                     if (el instanceof HTMLElement) {
                         el.style.color = '#000000 !important';
                         el.style.webkitTextFillColor = '#000000 !important';
                         el.style.background = 'none !important';
                         el.style.backgroundColor = 'transparent !important';
                         el.style.border = 'none !important';
                         el.style.textShadow = 'none !important';
                     }
                 });
             }
         });

        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = contentWidth;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        const pageMaxHeight = pageHeight - margin - 30;

        let heightLeft = pdfHeight;
        let position = currentPageHeight;

        while (heightLeft > 0) {
            if (position !== currentPageHeight && position > margin) { // Don't add page if it's the very first chunk
                pdf.addPage();
                position = 20;
            }

            let currentChunkHeight = Math.min(heightLeft, pageMaxHeight - (position - margin));

             if (position + currentChunkHeight > pageHeight - margin) {
                 currentChunkHeight = pageHeight - margin - position;
             }

             // Avoid tiny chunks causing infinite loops
             if (currentChunkHeight <= 1) {
                 if (heightLeft > 1 && position + heightLeft <= pageHeight - margin) {
                     currentChunkHeight = heightLeft; // Add the remainder if it fits
                 } else if (heightLeft > 1) {
                     // Need a new page for the remainder
                     pdf.addPage();
                     position = 20;
                     currentChunkHeight = Math.min(heightLeft, pageMaxHeight);
                 } else {
                     break; // Nothing left or too small to add
                 }
             }

            const canvasStartY = (pdfHeight - heightLeft) * (imgProps.height / pdfHeight);
            const canvasChunkHeight = currentChunkHeight * (imgProps.height / pdfHeight);

            pdf.addImage(imgData, 'PNG', margin, position, pdfWidth, currentChunkHeight, undefined, 'FAST', 0, canvasStartY, imgProps.width, canvasChunkHeight);

            heightLeft -= currentChunkHeight;
            position += currentChunkHeight;
        }

        // Add Footer
        const totalPages = pdf.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 15, pageHeight - 10);
          pdf.text('AI Bone Health Analysis | For Informational Purposes Only', margin, pageHeight - 10);
        }

        pdf.save(fileName);
        toast.success('PDF downloaded successfully');

    } catch (pdfError) {
        console.error("Error generating PDF:", pdfError);
        toast.error(`Failed to generate PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
    }
  };


  const handleConsultSpecialist = () => { // Unchanged
    if (!taskId) return;
    const specialistType = TASK_SPECIALISTS[taskId] || 'orthopedic doctor';
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(specialistType)}`;
    if (navigator.geolocation) {
      toast.info("Trying to find specialists near you...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const preciseMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(specialistType)}/@${latitude},${longitude},14z`;
          window.open(preciseMapsUrl, '_blank');
        },
        (error) => {
          console.warn("Geolocation failed:", error.message);
          toast.warn("Could not get your location. Opening general search.");
          window.open(mapsUrl, '_blank');
        },
        { timeout: 5000 }
      );
    } else {
      window.open(mapsUrl, '_blank');
    }
  };

  const openImageModal = () => setIsImageModalOpen(true);
  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setIsImageModalMaximized(false);
    setZoomLevel(1);
  };
  const toggleImageModalMaximize = () => setIsImageModalMaximized(!isImageModalMaximized);
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  // --- END HANDLERS ---

  // --- RENDER LOGIC ---
  if (!taskId || !user) return null;

  const taskTitle = TASK_TITLES[taskId] || 'Unknown Analysis';
  const taskGuidance = TASK_GUIDANCE[taskId] || 'Please upload an appropriate medical image for analysis.';

   const formatResults = (resultsText: string | null): JSX.Element | null => {
        if (!resultsText) return null;
        const formattedHtml = resultsText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br />');
        return (
            <div
                className="prose dark:prose-invert max-w-none text-typography-primary text-sm md:text-base"
                ref={resultsRef}
                dangerouslySetInnerHTML={{ __html: formattedHtml }}
                style={{ color: 'black' }} // Ensure black text for PDF
            />
        );
    };

  const fadeIn = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };
  // --- END RENDER LOGIC ---

  return (
    <div className="container mx-auto px-4 py-12">
       <style>
        {`
        .hover-scale { transition: transform 0.2s ease-out; }
        .hover-scale:hover { transform: scale(1.05); }
        .fade-in-title { opacity: 0; transform: translateY(-10px); transition: opacity 0.5s ease-out, transform 0.5s ease-out; }
        .fade-in-title.visible { opacity: 1; transform: translateY(0); }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .results-maximized { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 50; overflow: hidden; background-color: white; display: flex; flex-direction: column; }
        .results-maximized .card-content-maximized { flex-grow: 1; overflow-y: auto; }
        `}
      </style>

      {/* Header Buttons */}
      <motion.div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      >
        <Button variant="gradient" onClick={() => navigate('/bone-analysis')} className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl self-start">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Select Task
        </Button>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button variant="gradient" onClick={() => navigate('/')} className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl">
            <Home className="mr-2 h-4 w-4" /> Home
          </Button>
          {results && user.userType !== 'doctor' && (
            <Button variant="gradient" onClick={handleConsultSpecialist} className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-xl">
              <UserRound className="mr-2 h-4 w-4" /> Find a Specialist
            </Button>
          )}
        </div>
      </motion.div>

      {/* --- Main Title Block with Gradient Background --- */}
       <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-6 rounded-2xl mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${titleFadeIn ? 'fade-in-title visible' : 'fade-in-title'}`}>
          {taskTitle}
        </h1>
        <p className="text-muted-foreground">
           {user.userType === 'doctor' ?
              'AI-assisted analysis for clinical evaluation.' :
              'AI-powered analysis for informational purposes only. Always consult a qualified healthcare professional.'}
        </p>
      </div>
      {/* --- End Main Title Block --- */}


      {/* Main Content Grid */}
      <div className={`grid grid-cols-1 ${isResultsMaximized ? '' : 'lg:grid-cols-2'} gap-8`}>

        {/* Image Upload Card (Standard Header) */}
        {!isResultsMaximized && (
          <motion.div variants={fadeIn} initial="hidden" animate="visible" className="animate-fade-in">
            {/* REMOVED gradient from CardHeader, restored default text/bg */}
            <Card className="border transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
              <CardHeader className="border-b bg-gray-50 dark:bg-gray-700/50 p-4">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Upload Medical Image</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-6">{taskGuidance}</p>
                <ImageUpload onImageSelected={handleImageUpload} imageUrl={imageUrl} isLoading={analyzing} />
                <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
                  {imageUrl && (
                    <Button variant="outline" onClick={openImageModal} className="transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-xl flex items-center gap-2">
                      <Eye className="h-4 w-4" /> View Image
                    </Button>
                  )}
                  <Button onClick={handleAnalyze} disabled={!image || analyzing} variant="gradient" className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl w-full sm:w-auto">
                    {analyzing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>) : 'Analyze Image'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Analysis Results Card (Standard Header) */}
         <motion.div
            variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: isResultsMaximized ? 0 : 0.1 }}
            className={`animate-fade-in ${isResultsMaximized ? 'results-maximized' : 'lg:col-span-1'}`}
        >
            {/* REMOVED gradient from CardHeader, restored default text/bg */}
            <Card className={`border transition-all duration-300 ${isResultsMaximized ? 'h-full flex flex-col rounded-none border-none shadow-none bg-white dark:bg-gray-900' : 'hover:shadow-lg bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm'}`}>
                <CardHeader className={`flex flex-row items-center justify-between p-4 border-b bg-gray-50 dark:bg-gray-700/50 ${isResultsMaximized ? 'rounded-none' : 'rounded-t-lg'}`}>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Analysis Results</CardTitle>
                    <div className="flex items-center space-x-2">
                        {results && (
                            <Button variant="outline" size="sm" onClick={handleDownloadResults} className="flex items-center gap-1 transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-lg border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <Download size={14} /> <span className="hidden sm:inline">Download PDF</span>
                            </Button>
                        )}
                         <Button variant="ghost" size="icon" onClick={() => setIsResultsMaximized(!isResultsMaximized)} className="transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" title={isResultsMaximized ? "Minimize Results" : "Maximize Results"}>
                            {isResultsMaximized ? <Minimize size={16} /> : <Maximize size={16} />}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className={`p-6 ${isResultsMaximized ? 'card-content-maximized' : 'max-h-[60vh] overflow-y-auto'}`}>
                     {analyzing ? ( <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6 animate-pulse"><Loader2 className="h-8 w-8 text-primary mb-4 animate-spin" /><p className="text-muted-foreground">Processing...</p></div>)
                     : results ? ( formatResults(results) )
                     : error ? ( <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6 border rounded-md border-dashed border-destructive/50 bg-destructive/10"><p className="text-destructive font-medium">Analysis Failed</p><p className="text-destructive text-sm mt-2">{error}</p><Button variant="link" className="mt-4 text-destructive" onClick={() => setError(null)}>Dismiss</Button></div>)
                     : ( <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6 border rounded-md border-dashed"><p className="text-muted-foreground">Upload image & click "Analyze" for results.</p></div>)}
                </CardContent>
            </Card>
        </motion.div>

      </div> {/* End Grid */}

      {/* Chatbot Button (Unchanged logic) */}
        {results && !isResultsMaximized && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="mt-8 w-full flex justify-center">
                <ChatbotButton analysisContext={results} taskTitle={taskTitle} analysisId={analysisId} className="rounded-lg shadow-lg w-full max-w-md"/>
            </motion.div>
        )}

      {/* Image Modal (Unchanged logic, minor header style change) */}
      {isImageModalOpen && imageUrl && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-all duration-300`}>
          <motion.div className={`relative bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-2xl flex flex-col ${isImageModalMaximized ? 'w-full h-full' : 'max-w-4xl max-h-[90vh]'}`}
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
            {/* Modal Header - Standard Background */}
            <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700 flex-shrink-0">
               <p className="font-semibold text-gray-800 dark:text-white">Uploaded Image</p>
                <div className="flex items-center space-x-1">
                   <Button variant="ghost" size="icon" onClick={handleZoomIn} title="Zoom In" className="text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"><ZoomIn size={18} /></Button>
                   <Button variant="ghost" size="icon" onClick={handleZoomOut} title="Zoom Out" className="text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"><ZoomOut size={18} /></Button>
                   <Button variant="ghost" size="icon" onClick={toggleImageModalMaximize} title={isImageModalMaximized ? "Restore" : "Maximize"} className="text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                       {isImageModalMaximized ? <Minimize size={18} /> : <Maximize size={18} />}
                   </Button>
                    <Button variant="ghost" size="icon" onClick={closeImageModal} title="Close" className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"><X size={18} /></Button>
                </div>
            </div>
            {/* Modal Content */}
            <div className="flex-grow p-4 overflow-auto flex items-center justify-center">
              <img src={imageUrl} alt="Uploaded for analysis" className="block max-w-full max-h-full object-contain transition-transform duration-200 ease-out"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }} />
            </div>
          </motion.div>
        </div>
      )}

    </div> // End Container
  );
};

export default AnalysisPage;
