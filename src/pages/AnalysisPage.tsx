import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Home, Download, Maximize, Minimize, Eye, ZoomIn, ZoomOut, ArrowLeft, UserRound, ExternalLink, X as CloseIcon, AlertTriangle } from 'lucide-react';
import ChatbotButton from '@/components/ChatbotButton';
import { motion } from 'framer-motion';
import { AuroraBackground } from '@/components/ui/aurora-background';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import jsPDF from 'jspdf';
// html2canvas is not needed for this approach
import { isDoctor } from "@/types/auth";

// Constants remain the same...
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
    'fracture-detection': 'Orthopedic Surgeon',
    'bone-marrow': 'Hematologist',
    'osteoarthritis': 'Rheumatologist',
    'osteoporosis': 'Endocrinologist',
    'bone-age': 'Pediatric Endocrinologist',
    'spine-fracture': 'Spine Surgeon',
    'bone-tumor': 'Orthopedic Oncologist',
    'bone-infection': 'Orthopedic Surgeon',
};


const AnalysisPage = () => {
    const { taskId } = useParams<{ taskId: string }>();
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const [image, setImage] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null); // Local blob URL for preview
    const [imageBase64, setImageBase64] = useState<string | null>(null); // Base64 for analysis & PDF fallback
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [analysisId, setAnalysisId] = useState<string | null>(null);
    const [storedImageUrl, setStoredImageUrl] = useState<string | null>(null); // URL from Supabase storage after analysis
    const [isResultsMaximized, setIsResultsMaximized] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isImageModalMaximized, setIsImageModalMaximized] = useState(false);
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const resultsRef = useRef<HTMLDivElement>(null);
    const [titleFadeIn, setTitleFadeIn] = useState(false);
    const [showConsultDialog, setShowConsultDialog] = useState(false);

    useEffect(() => {
        if (!user) { navigate('/auth'); return; }
        setTimeout(() => setTitleFadeIn(true), 100);
        // Cleanup local object URL
        return () => {
            if (imageUrl && imageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [user, navigate]);

    useEffect(() => {
        if (taskId && !TASK_TITLES[taskId]) { toast.error('Invalid analysis task'); navigate('/tasks'); }
    }, [taskId, navigate]);

    const handleImageUpload = (file: File) => {
        if (imageUrl && imageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(imageUrl);
        }
        setImage(file);
        const newObjectURL = URL.createObjectURL(file);
        setImageUrl(newObjectURL); // Set for preview

        setResults(null); setError(null); setAnalysisId(null); setStoredImageUrl(null);
        setIsImageModalOpen(false); setIsImageModalMaximized(false); setZoomLevel(1); setShowConsultDialog(false);
        setImageBase64(null); // Reset base64 until new one is read

        const reader = new FileReader();
        reader.onloadend = () => {
            setImageBase64(reader.result as string); // Store base64
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyze = async () => {
        if (!image || !imageBase64 || !taskId || !user) { toast.error('Please upload an image first'); return; }
        setAnalyzing(true); setError(null); setResults(null); setShowConsultDialog(false);
        const toastId = toast.loading('Analyzing image, please wait...');
        try {
            // Ensure base64 is passed to the function
            const { data, error: functionError } = await supabase.functions.invoke('analyze-bone-image', { body: { image: imageBase64, taskId, userType: user.userType === 'doctor' ? 'doctor' : 'common', userId: user.id } });

            if (functionError) {
                console.error('Function error details:', functionError);
                // Check if it's a model availability issue
                if (functionError.message && functionError.message.includes('model')) {
                    throw new Error(`The AI model is currently unavailable. Our team has been notified and is working on it.`);
                } else {
                    throw new Error(`Analysis service failed: ${functionError.message}`);
                }
            }

            if (data?.error) {
                console.error('Data error details:', data.error);
                // Check if it's a model-related error
                if (typeof data.error === 'string' && data.error.includes('model')) {
                    throw new Error(`The AI model is currently unavailable. Our team has been notified and is working on it.`);
                } else {
                    throw new Error(data.error);
                }
            }

            if (!data?.analysis) throw new Error('Analysis service did not return valid results.');

            setResults(data.analysis);
            setAnalysisId(data.analysisId || null);
            setStoredImageUrl(data.imageUrl || null); // Store the URL from backend
            toast.success('Analysis complete! You can now use the chatbot to ask questions about your results.', { id: toastId, duration: 5000, dismissible: true });
        } catch (error) {
            console.error('Analysis error:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';

            // Set a more user-friendly error message
            setError(`Failed to analyze image. ${errorMessage}. Please try again later or contact support if the issue persists.`);

            // Show a more helpful toast message
            toast.error(`Analysis failed: ${errorMessage}`, { id: toastId, duration: 8000 });

            // No longer loading sample data on error
        } finally {
            setAnalyzing(false);
        }
    };

    const proceedToConsultation = () => {
        if (!taskId) return;
        const specialistType = TASK_SPECIALISTS[taskId] || 'medical specialist';
        const searchTerm = encodeURIComponent(`${specialistType} near me`);
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchTerm}`;

        // Open in the same tab instead of a new one
        window.location.href = mapsUrl;
        setShowConsultDialog(false);
    };

    const openImageModal = () => setIsImageModalOpen(true);
    const closeImageModal = () => { setIsImageModalOpen(false); setIsImageModalMaximized(false); setZoomLevel(1); };
    const toggleImageModalMaximize = () => setIsImageModalMaximized(!isImageModalMaximized);
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
    const formatResults = (resultsText: string | null): React.ReactNode => { /* ... (unchanged) ... */
        if (!resultsText) return <p className="text-muted-foreground">No results text available.</p>;
        try {
            const normalizedText = resultsText.replace(/\r\n/g, '\n').replace(/ +\n/g, '\n').trim();
            const textWithoutCodeBlocks = normalizedText.replace(/```[\s\S]*?```/g, '[Code Block Removed]');
            // Split more carefully, preserving paragraph breaks and list/heading indicators
            const blocks = textWithoutCodeBlocks.split(/(\n\n+|\n(?=[*\-•#])|\n(?=\d+\. ))/).filter(block => block && block.trim() !== '');

            return ( <div className="analysis-results-content space-y-3 leading-relaxed"> {blocks.map((block, index) => { const trimmedBlock = block.trim(); const headingMatch = trimmedBlock.match(/^(#{1,5})\s+(.*)/); if (headingMatch) { const level = headingMatch[1].length; const text = headingMatch[2]; const Tag = `h${level + 1}` as keyof JSX.IntrinsicElements; const textSize = ['text-xl', 'text-lg', 'text-base font-semibold', 'text-base', 'text-sm font-medium'][level -1] || 'text-sm'; return <Tag key={index} className={`${textSize} font-semibold mt-4 mb-1 text-primary border-b border-primary/30 pb-1`}>{text}</Tag>; } const keywordHeadingMatch = trimmedBlock.match(/^(Summary|Findings|Interpretation|Recommendations|Assessment|Diagnosis|Conclusion|Analysis Results)\s*[:*]?(.*)/i); if (keywordHeadingMatch) { const keyword = keywordHeadingMatch[1]; const textAfterKeyword = keywordHeadingMatch[2]?.trim(); return (<div key={index} className="mt-4 mb-2"><h3 className="text-lg font-semibold text-primary border-b border-primary/30 pb-1 inline-block">{keyword}:</h3>{textAfterKeyword && <span className="ml-2 text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: textAfterKeyword.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<em>$1</em>') }} />}</div>); } if (trimmedBlock.match(/^[*•-]\s+/)) { const listItems = trimmedBlock.split('\n').map(line => line.trim().replace(/^[*•-]\s+/, '')); return ( <ul key={index} className="list-disc pl-5 space-y-1.5 text-sm"> {listItems.filter(item => item).map((item, i) => ( <li key={i} className="text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<em>$1</em>') }} /> ))} </ul> ); } if (trimmedBlock.match(/^\d+\.\s+/)) { const listItems = trimmedBlock.split('\n').map(line => line.trim().replace(/^\d+\.\s+/, '')); return ( <ol key={index} className="list-decimal pl-5 space-y-1.5 text-sm"> {listItems.filter(item => item).map((item, i) => ( <li key={i} className="text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<em>$1</em>') }} /> ))} </ol> ); } if (!trimmedBlock) return null; return <p key={index} className="text-gray-700 dark:text-gray-300 text-sm" dangerouslySetInnerHTML={{ __html: trimmedBlock.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<em>$1</em>') }} />; })} </div> );
        } catch (e) { console.error("Error formatting results:", e); return <pre className="whitespace-pre-wrap text-sm">{resultsText}</pre>; }
    };

    // --- Updated PDF Download Function ---
    const handleDownloadResults = async () => {
        if (!results || !taskId) {
            toast.warning('No results available to download.');
            return;
        }

        const toastId = toast.loading('Generating PDF, please wait...');
        // Prefer stored URL, but keep base64 as a backup
        const imageSourceUrl = storedImageUrl;
        const imageSourceBase64 = imageBase64; // Captured during upload

        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const taskTitle = TASK_TITLES[taskId] || 'Bone Analysis';
            const analysisDate = new Date().toLocaleString();
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
                     // Estimate line height check
                     if (yPos + size / 2.5 > pageHeight - margin) {
                         pdf.addPage();
                         yPos = margin;
                     }
                     pdf.text(line, margin, yPos);
                     yPos += size / 2.5 + 1; // Move yPos down
                 });
                 yPos += spacing; // Add extra spacing after the block
             };

            // 1. Title, Date, User
            addText(taskTitle, 18, 'bold', 5);
            yPos += 5;
            addText(`Analysis Date: ${analysisDate}`, 10, 'normal', 2);
            if (user) {
                addText(`User: ${user.email || 'Anonymous'} ${user.userType === 'doctor' ? '(Doctor)' : '(Patient)'}`, 10, 'normal', 5);
            }
            yPos += 5;

            // 3. Add Image Section
            addText('Medical Image', 14, 'bold', 3);
            if (yPos > pageHeight - margin - 30) { // Check space before image section
                pdf.addPage();
                yPos = margin;
                addText('Medical Image', 14, 'bold', 3); // Re-add title on new page
            }
            const startImageY = yPos;
            let imageAddedSuccessfully = false;

            // --- Attempt 1: Use storedImageUrl (preferred) ---
            if (imageSourceUrl) {
                console.log("PDF Gen: Attempting image from URL:", imageSourceUrl);
                try {
                    const img = new Image();
                    img.crossOrigin = "Anonymous"; // Crucial for CORS
                    img.src = imageSourceUrl;

                    const imgLoaded = await new Promise<HTMLImageElement | null>((resolve) => {
                        img.onload = () => resolve(img);
                        img.onerror = (e) => {
                            console.error("PDF Gen Error: Failed to load image from URL.", "URL:", imageSourceUrl, "Error:", e);
                            resolve(null);
                        };
                        // Increased timeout
                        setTimeout(() => {
                             console.warn("PDF Gen Warning: Image load timeout for URL:", imageSourceUrl);
                             resolve(null);
                        }, 30000); // 30 seconds timeout
                    });

                    if (imgLoaded) {
                        const imgProps = pdf.getImageProperties(imgLoaded);
                        const aspectRatio = imgProps.width / imgProps.height;
                        const availableHeight = pageHeight - yPos - margin; // Max height on current/new page
                        let imgWidth = contentWidth;
                        let imgHeight = imgWidth / aspectRatio;

                        // Scale based on height if it exceeds available space
                        if (imgHeight > availableHeight) {
                            imgHeight = availableHeight;
                            imgWidth = imgHeight * aspectRatio;
                             // If it's now too wide after height scaling, scale by width again
                             if (imgWidth > contentWidth) {
                                imgWidth = contentWidth;
                                imgHeight = imgWidth / aspectRatio;
                             }
                        }

                        const xOffset = margin + (contentWidth - imgWidth) / 2; // Center horizontally

                        // Check if image itself needs a new page
                        if (yPos + imgHeight > pageHeight - margin) {
                           pdf.addPage();
                           yPos = margin;
                           addText('Medical Image (cont.)', 14, 'bold', 3); // Optional title continuation
                        }

                        pdf.addImage(imgLoaded, imgProps.fileType, xOffset, yPos, imgWidth, imgHeight);
                        yPos += imgHeight + 10; // Move yPos below image + spacing
                        imageAddedSuccessfully = true;
                        console.log("PDF Gen: Image added successfully from URL.");
                    } else {
                         console.log("PDF Gen: Failed to load image from URL, trying Base64 fallback.");
                    }
                } catch (urlImgError) {
                    console.error("PDF Gen Error: Exception processing image from URL:", urlImgError);
                    // Proceed to Base64 fallback
                }
            } else {
                 console.log("PDF Gen: No storedImageUrl found, attempting Base64 fallback.");
            }

            // --- Attempt 2: Fallback to imageBase64 ---
            if (!imageAddedSuccessfully && imageSourceBase64) {
                console.log("PDF Gen: Attempting image from Base64.");
                try {
                    // jsPDF's addImage can often handle the full data URI directly
                    const base64Data = imageSourceBase64;

                    // We still need dimensions. Create an image element in memory.
                    const img = new Image();
                    const dimensionsLoaded = await new Promise<{ width: number, height: number } | null>((resolve) => {
                        img.onload = () => resolve({ width: img.width, height: img.height });
                        img.onerror = (e) => {
                           console.error("PDF Gen Error: Could not get dimensions from Base64 image.", e);
                           resolve(null);
                        };
                        img.src = base64Data;
                        setTimeout(() => {
                           console.warn("PDF Gen Warning: Timeout getting dimensions from Base64.");
                           resolve(null);
                        }, 10000); // Shorter timeout for local data
                     });

                    if (dimensionsLoaded) {
                         const imageFormatMatch = base64Data.match(/^data:image\/(png|jpeg|jpg);base64,/);
                         const imageFormat = imageFormatMatch ? imageFormatMatch[1].toUpperCase() : 'JPEG'; // Default to JPEG if format missing

                        const aspectRatio = dimensionsLoaded.width / dimensionsLoaded.height;
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

                        if (yPos + imgHeight > pageHeight - margin) { // Check page break
                            pdf.addPage();
                            yPos = margin;
                            addText('Medical Image (cont.)', 14, 'bold', 3);
                        }

                        pdf.addImage(base64Data, imageFormat, xOffset, yPos, imgWidth, imgHeight);
                        yPos += imgHeight + 10;
                        imageAddedSuccessfully = true;
                        console.log("PDF Gen: Image added successfully from Base64.");
                    } else {
                        console.error("PDF Gen Error: Failed to get dimensions for Base64 image.");
                    }
                } catch (base64ImgError) {
                    console.error("PDF Gen Error: Exception processing image from Base64:", base64ImgError);
                }
            }

            // --- Final Check: If image still not added ---
            if (!imageAddedSuccessfully) {
                 // Check page break before adding error message
                if (yPos > pageHeight - margin - 10) {
                    pdf.addPage();
                    yPos = margin;
                    // Don't re-add 'Medical Image' title here, just the error
                 }
                addText("Error: Could not load the medical image for the PDF.", 10, 'italic', 5);
                console.log("PDF Gen: Failed to add image from both URL and Base64 sources.");
                yPos += 5;
            }


            // 4. Add Analysis Results
            if (results) {
                if (yPos > pageHeight - margin - 20) { // Check space before results section
                     pdf.addPage();
                     yPos = margin;
                }
                addText('Analysis Results', 14, 'bold', 5);

                // Simple text formatting (replace HTML/Markdown-like tags)
                 const cleanResults = results
                    .replace(/\r\n/g, '\n') // Normalize line breaks
                    .replace(/```[\s\S]*?```/g, '\n[Code Block Removed]\n') // Remove code blocks
                    .replace(/^(#{1,5})\s+(.*)/gm, (match, p1, p2) => `\n**${p2.trim()}**\n`) // Convert markdown headings
                    .replace(/^(Summary|Findings|Interpretation|Recommendations|Assessment|Diagnosis|Conclusion|Analysis Results)\s*[:*]?/gmi, '\n**$1:**') // Bold keywords
                    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown (handled by jsPDF font style)
                    .replace(/__(.*?)__/g, '$1') // Remove italic markdown
                    .replace(/^[*•-]\s+/gm, '  • ') // Convert bullets
                    .replace(/^\d+\.\s+/gm, (match) => `  ${match}`) // Indent numbered lists
                    .replace(/<br\s*\/?>/gi, '\n') // Handle <br>
                    .replace(/<\/?(p|strong|b|em|i|ul|ol|li|h[1-6])>/gi, '') // Strip common HTML
                    .replace(/ /g, ' ')
                    .replace(/ +\n/g, '\n')
                    .replace(/\n{3,}/g, '\n\n') // Collapse multiple empty lines
                    .trim();

                const resultBlocks = cleanResults.split('\n\n');

                resultBlocks.forEach(block => {
                    const trimmedBlock = block.trim();
                    if (!trimmedBlock) return;

                    // Basic styling based on our cleaning patterns
                    if (trimmedBlock.startsWith('**') && trimmedBlock.endsWith('**')) {
                        addText(trimmedBlock.slice(2, -2), 12, 'bold', 3);
                    } else if (trimmedBlock.startsWith('**') && trimmedBlock.endsWith(':')) {
                        addText(trimmedBlock.slice(2), 12, 'bold', 3);
                    } else {
                         addText(trimmedBlock, 10, 'normal', 3);
                    }
                    yPos += 2; // Add small space between blocks
                });
            }

            // 5. Add Page Numbers
            const pageCount = pdf.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.setFontSize(8);
                pdf.setTextColor(150); // Light gray
                pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });
            }

            // 6. Save the PDF
            const date = new Date().toISOString().split('T')[0];
            const cleanTitle = taskTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            pdf.save(`${cleanTitle}_analysis_${date}.pdf`);

            toast.success('PDF downloaded successfully!', { id: toastId });
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: toastId });
        }
    };
    // --- End of Updated PDF Download Function ---


    if (!taskId || !user) return null;
    const taskTitle = TASK_TITLES[taskId] || 'Unknown Analysis';
    const taskGuidance = TASK_GUIDANCE[taskId] || 'Please upload an appropriate medical image for analysis.';
    const specialistType = TASK_SPECIALISTS[taskId] || 'medical specialist';
    const fadeIn = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };

    return (
        <AuroraBackground showRadialGradient={true}>
            <div className="container mx-auto px-4 py-12 ">
                {/* Styles (unchanged) */}
                 <style>{`
                    .hover-scale { transition: transform 0.2s ease-out; }
                    .hover-scale:hover { transform: scale(1.05); }
                    .fade-in-title { opacity: 0; transform: translateY(-10px); transition: opacity 0.5s ease-out, transform 0.5s ease-out; }
                    .fade-in-title.visible { opacity: 1; transform: translateY(0); }
                    .animate-fade-in { animation: fadeInAnimation 0.5s ease-out forwards; }
                    @keyframes fadeInAnimation { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    .analysis-results-content p,
                    .analysis-results-content li,
                    .analysis-results-content h1,
                    .analysis-results-content h2,
                    .analysis-results-content h3,
                    .analysis-results-content h4,
                    .analysis-results-content strong,
                    .analysis-results-content em,
                    .analysis-results-content b,
                    .analysis-results-content i {
                        color: inherit !important; /* Inherit color from CardContent */
                    }
                    /* Custom Scrollbar */
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); border-radius: 3px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 3px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
                    /* Dark mode scrollbar */
                    html.dark .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
                    html.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
                    html.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
                 `}</style>

                {/* Navigation Buttons (unchanged) */}
                <motion.div className="flex justify-between items-center mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <Button variant="gradient" onClick={() => navigate('/bone-analysis')} className="hover-scale rounded-xl text-xs sm:text-sm" size="sm"> <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Tasks </Button>
                    <Button variant="gradient" onClick={() => navigate('/')} className="hover-scale rounded-xl text-xs sm:text-sm" size="sm"> <Home className="mr-1.5 h-4 w-4" /> Home </Button>
                </motion.div>

                {/* Title Section (unchanged) */}
                <div className={`bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-6 rounded-xl mb-8 shadow-sm border border-black/5 dark:border-white/5 ${titleFadeIn ? 'fade-in-title visible' : 'fade-in-title'}`}>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1">{taskTitle}</h1>
                    <p className="text-sm text-muted-foreground">{user.userType === 'doctor' ? 'AI-assisted analysis for clinical evaluation' : 'AI-powered analysis for informational purposes only'}</p>
                </div>

                 {/* Main Grid: Upload & Results (unchanged structure) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Image Upload Card (unchanged) */}
                    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="animate-fade-in">
                        <Card className="border transition-all duration-300 hover:shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-primary-foreground rounded-t-lg p-4">
                                <CardTitle className="text-base sm:text-lg font-semibold">Upload Medical Image</CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                <p className="text-xs sm:text-sm text-muted-foreground mb-4">{taskGuidance}</p>
                                <ImageUpload onImageSelected={handleImageUpload} imageUrl={imageUrl} isLoading={analyzing} />
                                <div className="mt-5 flex flex-col sm:flex-row justify-between gap-3">
                                    {imageUrl && (<Button variant="outline" size="sm" onClick={openImageModal} className="flex-1 sm:flex-none text-xs sm:text-sm hover-scale rounded-md border-primary/50 text-primary hover:bg-primary/10"> <Eye className="mr-1.5 h-4 w-4" /> View Image </Button>)}
                                    <Button size="sm" onClick={handleAnalyze} disabled={!image || analyzing || !imageBase64} /* Disable if base64 not ready */ className="flex-1 sm:flex-none text-xs sm:text-sm hover-scale rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white disabled:opacity-60">
                                        {analyzing ? (<><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Analyzing...</>) : 'Analyze Image'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Analysis Results Card (unchanged structure, but download button logic updated) */}
                     <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className={`animate-fade-in ${isResultsMaximized ? 'fixed inset-0 z-50 overflow-hidden bg-background' : ''}`}>
                        <Card className={`border transition-all duration-300 ${isResultsMaximized ? 'h-full w-full rounded-none shadow-none border-none' : 'hover:shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg overflow-hidden'}`}>
                            <CardHeader className={`flex flex-row items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-primary-foreground ${isResultsMaximized ? 'sticky top-0 z-10' : 'rounded-t-lg'}`}>
                                <CardTitle className="text-base sm:text-lg font-semibold">Analysis Results</CardTitle>
                                <div className="flex items-center space-x-1">
                                    {/* Download button enabled only when results are available */}
                                    <Button variant="outline" size="icon" title="Download PDF" onClick={handleDownloadResults} disabled={!results || analyzing} className="hover-scale rounded-md bg-white/20 text-white border-white/30 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed w-8 h-8"> <Download size={16} /> </Button>
                                    <Button variant="ghost" size="icon" title={isResultsMaximized ? "Minimize" : "Maximize"} onClick={() => setIsResultsMaximized(!isResultsMaximized)} className="hover-scale rounded-md text-white hover:bg-white/20 w-8 h-8"> {isResultsMaximized ? <Minimize size={18} /> : <Maximize size={18} />} </Button>
                                </div>
                            </CardHeader>
                            <CardContent className={`p-5 ${isResultsMaximized ? 'h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar' : 'min-h-[200px] max-h-[60vh] overflow-y-auto custom-scrollbar'} ${isResultsMaximized ? 'bg-background' : 'bg-white/95 dark:bg-gray-900/90 rounded-b-lg'}`}>
                                <div ref={resultsRef}>
                                    {results ? (
                                        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none animate-fade-in text-gray-800 dark:text-gray-200">
                                            {formatResults(results)}
                                        </div>
                                    ) : error ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center text-destructive animate-fade-in p-4">
                                            <p className="font-medium text-base">Analysis Failed</p>
                                            <p className="text-xs mt-1 mb-4">{error}</p>

                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                                            <p className="text-sm">
                                                {analyzing ? (<span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processing analysis...</span>) : 'Upload an image and click "Analyze Image" to view results.'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                 {/* Post-Analysis Actions */}
                 {results && (
                    <motion.div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
                        <ChatbotButton analysisContext={results} taskTitle={taskTitle} analysisId={analysisId} className="rounded-lg w-full sm:w-auto text-xs sm:text-sm" size="sm" />
                        {user && !isDoctor(user) && (
                            <Button variant="gradient" size="sm" onClick={() => setShowConsultDialog(true)} className="hover-scale rounded-xl text-xs sm:text-sm">
                                <UserRound className="mr-1.5 h-4 w-4" /> Consult a Specialist Near You
                            </Button>
                        )}
                    </motion.div>
                )}



                {/* Consultation Dialog (unchanged) */}
                <Dialog open={showConsultDialog} onOpenChange={setShowConsultDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader> <DialogTitle className="flex items-center gap-2 text-lg"><UserRound className="h-5 w-5 text-primary" />Find a Specialist?</DialogTitle> <DialogDescription className="pt-2 text-sm"> This will open Google Maps to search for a <strong className="text-primary">{specialistType}</strong> near you. <br /><br /> <span className="text-xs text-muted-foreground"> Disclaimer: This search is for informational purposes only and does not constitute a medical referral or endorsement. Always consult with a qualified healthcare provider for medical advice. </span> </DialogDescription> </DialogHeader>
                        <DialogFooter className="mt-4 sm:justify-end gap-2"> <Button type="button" size="sm" variant="outline" onClick={() => setShowConsultDialog(false)}>Cancel</Button> <Button type="button" size="sm" onClick={proceedToConsultation} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white"> <ExternalLink className="mr-1.5 h-4 w-4" /> Proceed to Maps </Button> </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Image Viewer Modal (unchanged) */}
                {isImageModalOpen && imageUrl && (
                    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity duration-300 ${isImageModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                         <motion.div className={`relative bg-white dark:bg-gray-900 shadow-2xl rounded-lg overflow-hidden flex flex-col ${isImageModalMaximized ? 'w-full h-full' : 'max-w-4xl w-full max-h-[90vh]'}`}
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
                                    <Button variant="ghost" size="icon" onClick={closeImageModal} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 w-8 h-8"><CloseIcon size={20} /></Button>
                                </div>
                            </div>
                            <div className="flex-grow p-4 overflow-auto flex items-center justify-center">
                                <img
                                    src={imageUrl} // Modal viewer uses the local blob URL for immediate preview
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
