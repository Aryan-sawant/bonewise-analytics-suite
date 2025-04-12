
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, X, Loader2, Maximize, Minimize, BrainCircuit, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Add type definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface ChatbotButtonProps {
  analysisContext: string;
  taskTitle: string;
  analysisId: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon"; // Add the size prop to interface
}

interface ChatMessage {
  text: string;
  isUser: boolean;
  isLoading?: boolean;
}

const ChatbotButton: React.FC<ChatbotButtonProps> = ({ analysisContext, taskTitle, analysisId, className, size = "default" }) => {
  const { user } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { text: `Hello! I'm your bone health assistant. How can I help you with your ${taskTitle || 'analysis'} results?`, isUser: false }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice assistant related state
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  // Initialize speech synthesis and recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize speech synthesis
      if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
        console.log('Speech synthesis initialized');

        // Force load voices (especially important for Chrome)
        // Chrome loads voices asynchronously, so we need to force it
        window.speechSynthesis.onvoiceschanged = () => {
          const voices = window.speechSynthesis.getVoices();
          console.log(`Voices loaded: ${voices.length}`);

          // Log Hindi and Indian voices specifically
          const hindiVoices = voices.filter(voice => voice.lang === 'hi-IN');
          const indianVoices = voices.filter(voice => voice.lang.endsWith('-IN'));

          if (hindiVoices.length > 0) {
            console.log('Hindi voices available:', hindiVoices.map(v => v.name).join(', '));
          } else {
            console.log('No Hindi voices available');
          }

          if (indianVoices.length > 0) {
            console.log('Indian voices available:', indianVoices.map(v => v.name).join(', '));
          } else {
            console.log('No Indian voices available');
          }
        };

        // Trigger voice loading
        window.speechSynthesis.getVoices();
      } else {
        console.warn('Speech synthesis not supported in this browser');
      }

      // Initialize speech recognition
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');

          setTranscript(transcript);
          console.log('Transcript:', transcript);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          toast.error(`Speech recognition error: ${event.error}`);
        };

        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
        };

        console.log('Speech recognition initialized');
      } else {
        console.warn('Speech recognition not supported in this browser');
      }
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
      }
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Stop speaking when chatbot is closed or when navigating away
  useEffect(() => {
    // Stop speaking when chatbot is closed
    if (!isOpen && isSpeaking) {
      stopSpeaking();
    }

    // Stop speaking when navigating away (component unmount)
    return () => {
      if (isSpeaking) {
        stopSpeaking();
      }
    };
  }, [isOpen, isSpeaking]);

  // Toggle voice recognition
  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in your browser');
      return;
    }

    if (isListening) {
      // Stop listening and process the transcript
      recognitionRef.current.stop();
      if (transcript.trim()) {
        handleVoiceInput(transcript);
      }
      setTranscript('');
    } else {
      // Start listening
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.success('Listening... Speak now');
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast.error('Failed to start speech recognition');
      }
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (synthRef.current && synthRef.current.speaking) {
      try {
        synthRef.current.cancel();
        console.log('Speech stopped by user');
        toast.info('Speech stopped');
      } catch (error) {
        console.error('Error stopping speech:', error);
      }
    }

    setIsSpeaking(false);
    currentUtteranceRef.current = null;
  };

  // Speak text using browser's speech synthesis
  const speakWithBrowserSynthesis = (text: string) => {
    if (!synthRef.current) {
      console.error('Speech synthesis not available');
      toast.error('Speech synthesis not available on your browser');
      return;
    }

    try {
      // Clean up HTML tags for speech
      const cleanText = text.replace(/<[^>]*>/g, '');

      // Log the text being spoken for debugging
      console.log('Speaking text:', cleanText.substring(0, 100) + '...');

      // Force reload voices to ensure we have the latest list
      const availableVoices = window.speechSynthesis.getVoices();
      console.log(`Available voices before speaking: ${availableVoices.length}`);

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Detect language
      // Hindi: \u0900-\u097F
      // Arabic: \u0600-\u06FF
      // Chinese: \u4E00-\u9FFF
      // Japanese: \u3040-\u30FF
      // Korean: \uAC00-\uD7AF
      // Russian/Cyrillic: \u0400-\u04FF
      // Thai: \u0E00-\u0E7F

      let detectedLang = 'en-US'; // Default to English

      // Calculate the percentage of characters that belong to a specific script
      const getScriptPercentage = (text: string, scriptRegex: RegExp): number => {
        const matches = text.match(scriptRegex);
        return matches ? matches.length / text.length : 0;
      };

      // Check for Hindi (Devanagari script)
      const hindiPercentage = getScriptPercentage(cleanText, /[\u0900-\u097F]/g);

      // If any Devanagari characters are present, consider it Hindi
      // This is more aggressive than before, but ensures Hindi detection
      if (hindiPercentage > 0) {
        detectedLang = 'hi-IN'; // Hindi
        console.log(`Detected Hindi with ${(hindiPercentage * 100).toFixed(1)}% Devanagari characters`);

        // Log the first few Devanagari characters for debugging
        const devanagariChars = cleanText.match(/[\u0900-\u097F]/g);
        if (devanagariChars && devanagariChars.length > 0) {
          console.log('First few Devanagari characters:', devanagariChars.slice(0, 10).join(''));
        }

        // Use specialized Hindi speech function instead of continuing with regular speech
        speakHindi(cleanText);
        return; // Exit the function early
      }
      // Check for Arabic script
      else if (/[\u0600-\u06FF]/.test(cleanText)) {
        detectedLang = 'ar-SA'; // Arabic
      }
      // Check for Chinese characters
      else if (/[\u4E00-\u9FFF]/.test(cleanText)) {
        detectedLang = 'zh-CN'; // Chinese
      }
      // Check for Japanese characters
      else if (/[\u3040-\u30FF]/.test(cleanText)) {
        detectedLang = 'ja-JP'; // Japanese
      }
      // Check for Korean characters
      else if (/[\uAC00-\uD7AF]/.test(cleanText)) {
        detectedLang = 'ko-KR'; // Korean
      }
      // Check for Cyrillic (Russian) characters
      else if (/[\u0400-\u04FF]/.test(cleanText)) {
        detectedLang = 'ru-RU'; // Russian
      }
      // Check for Thai characters
      else if (/[\u0E00-\u0E7F]/.test(cleanText)) {
        detectedLang = 'th-TH'; // Thai
      }
      // Check for Spanish characters
      else if (/[á-úñÁ-ÚÑ]/.test(cleanText)) {
        detectedLang = 'es-ES'; // Spanish
      }
      // Check for French characters
      else if (/[àèìòùéêëïç]/.test(cleanText)) {
        detectedLang = 'fr-FR'; // French
      }

      // Special case: Check for Hindi words written in Latin script
      const hindiWords = ['namaste', 'namaskar', 'dhanyavaad', 'shukriya', 'kaise', 'kya', 'hai', 'aap', 'tum', 'main'];
      const words = cleanText.toLowerCase().split(/\s+/);
      const hindiWordCount = words.filter(word => hindiWords.includes(word)).length;

      if (detectedLang === 'en-US' && hindiWordCount > 0 && hindiWordCount / words.length > 0.2) {
        // If more than 20% of words are common Hindi words written in Latin script
        detectedLang = 'hi-IN';
        console.log(`Detected transliterated Hindi with ${hindiWordCount} common Hindi words`);
      }

      console.log(`Detected language: ${detectedLang}`);
      utterance.lang = detectedLang;

      // Get available voices
      const voices = synthRef.current.getVoices();
      console.log(`Available voices: ${voices.length}`);

      // Log all available voices for debugging
      if (voices.length > 0) {
        console.log('Available voices:');
        voices.forEach((voice, index) => {
          console.log(`${index + 1}. ${voice.name} (${voice.lang})${voice.default ? ' - DEFAULT' : ''}`);
        });
      }

      if (voices.length === 0) {
        // Force voice loading in Chrome
        synthRef.current.cancel();
        setTimeout(() => {
          const newVoices = synthRef.current?.getVoices() || [];
          console.log(`After forcing: ${newVoices.length} voices`);
          if (newVoices.length > 0) {
            completeVoiceSetup(utterance, newVoices);
          }
        }, 100);
      } else {
        completeVoiceSetup(utterance, voices);
      }
    } catch (speechError) {
      console.error('Error with speech synthesis:', speechError);
      toast.error('Error with speech synthesis');
    }
  };

  // Helper function to complete voice setup and speak
  const completeVoiceSetup = (utterance: SpeechSynthesisUtterance, voices: SpeechSynthesisVoice[]) => {
    if (!synthRef.current) return;

    // Try to find a matching voice with appropriate accent
    let matchingVoice = null;

    // First try: exact language match
    matchingVoice = voices.find(voice => voice.lang === utterance.lang);

    // Second try: language code match (e.g., 'hi' for 'hi-IN')
    if (!matchingVoice) {
      const langCode = utterance.lang.split('-')[0];
      matchingVoice = voices.find(voice => voice.lang.startsWith(langCode));
    }

    // For Hindi specifically, try to find the best voice
    if (utterance.lang === 'hi-IN') {
      console.log('Finding best voice for Hindi...');

      // Log all available voices for debugging
      console.log('All available voices:');
      voices.forEach((voice, i) => {
        console.log(`${i+1}. ${voice.name} (${voice.lang})`);
      });

      // Try to find a Hindi voice first
      const hindiVoices = voices.filter(voice => voice.lang === 'hi-IN');
      console.log(`Found ${hindiVoices.length} Hindi voices`);

      if (hindiVoices.length > 0) {
        // Log all Hindi voices
        hindiVoices.forEach((voice, i) => {
          console.log(`Hindi voice ${i+1}: ${voice.name}`);
        });

        // Prefer Google's Hindi voices if available (they tend to be better quality)
        const googleHindiVoice = hindiVoices.find(voice => voice.name.includes('Google'));
        if (googleHindiVoice) {
          matchingVoice = googleHindiVoice;
          console.log('Using Google Hindi voice:', googleHindiVoice.name);
        } else {
          // Otherwise use the first Hindi voice
          matchingVoice = hindiVoices[0];
          console.log('Using Hindi voice:', hindiVoices[0].name);
        }
      }

      // If no Hindi voice is available, try to find an Indian English voice
      if (!matchingVoice) {
        const indianEnglishVoices = voices.filter(voice => voice.lang === 'en-IN');
        console.log(`Found ${indianEnglishVoices.length} Indian English voices`);

        if (indianEnglishVoices.length > 0) {
          // Log all Indian English voices
          indianEnglishVoices.forEach((voice, i) => {
            console.log(`Indian English voice ${i+1}: ${voice.name}`);
          });

          // Prefer Google's Indian English voices if available
          const googleIndianVoice = indianEnglishVoices.find(voice => voice.name.includes('Google'));
          if (googleIndianVoice) {
            matchingVoice = googleIndianVoice;
            console.log('Using Google Indian English voice as fallback for Hindi:', googleIndianVoice.name);
          } else {
            // Otherwise use the first Indian English voice
            matchingVoice = indianEnglishVoices[0];
            console.log('Using Indian English voice as fallback for Hindi:', indianEnglishVoices[0].name);
          }
        }
      }

      // If still no matching voice, try to find any voice with 'Hindi' in the name
      if (!matchingVoice) {
        const hindiNameVoice = voices.find(voice => voice.name.toLowerCase().includes('hindi'));
        if (hindiNameVoice) {
          matchingVoice = hindiNameVoice;
          console.log('Using voice with Hindi in name:', hindiNameVoice.name);
        }
      }

      // If still no matching voice, try Microsoft voices which often have good Hindi support
      if (!matchingVoice) {
        const microsoftVoice = voices.find(voice => voice.name.includes('Microsoft'));
        if (microsoftVoice) {
          matchingVoice = microsoftVoice;
          console.log('Using Microsoft voice as fallback:', microsoftVoice.name);
        }
      }
    }

    // For other languages, try to find any voice from the same region
    if (!matchingVoice) {
      const region = utterance.lang.split('-')[1];
      if (region) {
        matchingVoice = voices.find(voice => voice.lang.endsWith(`-${region}`));
        console.log(`Using regional voice (${region}) as fallback`);
      }
    }

    // Last resort: default voice or first available
    if (!matchingVoice) {
      matchingVoice = voices.find(voice => voice.default) || (voices.length > 0 ? voices[0] : null);
    }

    if (matchingVoice) {
      console.log(`Using voice: ${matchingVoice.name} (${matchingVoice.lang})`);
      utterance.voice = matchingVoice;
    }

    // Set rate and pitch based on language
    switch(utterance.lang) {
      case 'hi-IN': // Hindi
        // For Hindi, adjust rate based on voice
        if (matchingVoice) {
          if (matchingVoice.name.includes('Google')) {
            utterance.rate = 0.85; // Google Hindi voices need to be slower
            utterance.pitch = 1.0;
          } else if (matchingVoice.lang === 'en-IN') {
            utterance.rate = 0.8; // Even slower for Indian English speaking Hindi
            utterance.pitch = 0.9; // Slightly lower pitch for better accent
          } else {
            utterance.rate = 0.85;
            utterance.pitch = 1.0;
          }
        } else {
          utterance.rate = 0.85;
          utterance.pitch = 1.0;
        }
        break;
      case 'ar-SA': // Arabic
      case 'th-TH': // Thai
        utterance.rate = 0.9; // Slightly slower
        utterance.pitch = 1.0;
        break;
      case 'ja-JP': // Japanese
      case 'zh-CN': // Chinese
        utterance.rate = 0.85; // Even slower
        utterance.pitch = 1.0;
        break;
      case 'ko-KR': // Korean
        utterance.rate = 0.88;
        utterance.pitch = 1.0;
        break;
      case 'ru-RU': // Russian
        utterance.rate = 0.92;
        utterance.pitch = 1.0;
        break;
      case 'es-ES': // Spanish
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        break;
      case 'fr-FR': // French
        utterance.rate = 0.93;
        utterance.pitch = 1.0;
        break;
      default: // English and others
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
    }

    // Set up event handlers
    utterance.onstart = () => {
      console.log('Speech started');
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      console.log('Speech ended');
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error('Speech error:', event);
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };

    // Store reference for stopping
    currentUtteranceRef.current = utterance;

    // Cancel any ongoing speech
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }

    // Speak
    synthRef.current.speak(utterance);
  };

  // Handle voice input
  const handleVoiceInput = async (text: string) => {
    if (!text.trim()) return;

    // Detect language of input
    const containsHindi = /[\u0900-\u097F]/.test(text);
    console.log(`Input appears to be in ${containsHindi ? 'Hindi' : 'English'}`);

    // Add user message to chat
    setMessages(prev => [...prev, { text, isUser: true }]);
    setTranscript('');

    // Add loading message
    setMessages(prev => [...prev, { text: 'Thinking...', isUser: false, isLoading: true }]);
    setIsLoading(true);

    try {
      // Detect language of user input
      let detectedLanguage = '';
      let languageInstruction = '';

      // Hindi: \u0900-\u097F
      if (/[\u0900-\u097F]/.test(text)) {
        detectedLanguage = 'Hindi';
        languageInstruction = 'The user is speaking in Hindi. Please respond in Hindi using Devanagari script (\u0900-\u097F). Do not transliterate Hindi into Latin/English characters.';
      }
      // Arabic: \u0600-\u06FF
      else if (/[\u0600-\u06FF]/.test(text)) {
        detectedLanguage = 'Arabic';
        languageInstruction = 'The user is speaking in Arabic. Please respond in Arabic.';
      }
      // Chinese: \u4E00-\u9FFF
      else if (/[\u4E00-\u9FFF]/.test(text)) {
        detectedLanguage = 'Chinese';
        languageInstruction = 'The user is speaking in Chinese. Please respond in Chinese.';
      }
      // Japanese: \u3040-\u30FF
      else if (/[\u3040-\u30FF]/.test(text)) {
        detectedLanguage = 'Japanese';
        languageInstruction = 'The user is speaking in Japanese. Please respond in Japanese.';
      }
      // Korean: \uAC00-\uD7AF
      else if (/[\uAC00-\uD7AF]/.test(text)) {
        detectedLanguage = 'Korean';
        languageInstruction = 'The user is speaking in Korean. Please respond in Korean.';
      }
      // Russian/Cyrillic: \u0400-\u04FF
      else if (/[\u0400-\u04FF]/.test(text)) {
        detectedLanguage = 'Russian';
        languageInstruction = 'The user is speaking in Russian. Please respond in Russian.';
      }
      // Thai: \u0E00-\u0E7F
      else if (/[\u0E00-\u0E7F]/.test(text)) {
        detectedLanguage = 'Thai';
        languageInstruction = 'The user is speaking in Thai. Please respond in Thai.';
      }
      // Spanish
      else if (/[á-úñÁ-ÚÑ]/.test(text)) {
        detectedLanguage = 'Spanish';
        languageInstruction = 'The user is speaking in Spanish. Please respond in Spanish.';
      }
      // French
      else if (/[àèìòùéêëïç]/.test(text)) {
        detectedLanguage = 'French';
        languageInstruction = 'The user is speaking in French. Please respond in French.';
      }

      if (detectedLanguage) {
        console.log(`Detected user input language: ${detectedLanguage}`);
      }

      const contextPrompt = `
        You are a professional bone health assistant helping with medical image analysis results.
        The user is asking about this analysis result: "${taskTitle || 'bone analysis'}"

        Context from the analysis:
        ${analysisContext || 'No analysis data available.'}

        ${languageInstruction}

        Please respond to the user's question in a professional, helpful way. Format your response
        naturally without using markdown. Be direct, informative, and use paragraph breaks for readability.
        Make sure to format important information using HTML <b> tags for bold (not markdown asterisks).
        Keep your response concise and suitable for voice output.
      `;

      const { data, error } = await supabase.functions.invoke('chat-with-gemini', {
        body: {
          message: text,
          context: contextPrompt,
          userType: user?.userType || 'common',
          userId: user?.id,
          analysisId: analysisId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Remove loading message
      setMessages(prev => prev.filter(msg => !msg.isLoading));

      const botResponse: ChatMessage = {
        text: data.response || "I'm sorry, I couldn't generate a response. Please try again.",
        isUser: false
      };

      setMessages(prev => [...prev, botResponse]);

      // Speak the response if in voice mode
      if (isVoiceMode) {
        // Stop any ongoing speech first
        if (synthRef.current && synthRef.current.speaking) {
          synthRef.current.cancel();
        }
        // Slight delay to ensure UI updates before speaking
        setTimeout(() => {
          speakWithBrowserSynthesis(botResponse.text);
        }, 300);
      }

    } catch (error) {
      console.error('Error processing voice input:', error);
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      setMessages(prev => [...prev, {
        text: 'Sorry, I encountered an error processing your request. Please try again with a different question.',
        isUser: false
      }]);
      toast.error('Failed to process voice input. Please try a different question.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle text input
  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = { text: message, isUser: true };
    setMessages([...messages, userMessage]);

    setMessages(prev => [...prev, { text: '', isUser: false, isLoading: true }]);

    setMessage('');
    setIsLoading(true);

    try {
      // Detect language of user input
      let detectedLanguage = '';
      let languageInstruction = '';

      // Hindi: \u0900-\u097F
      if (/[\u0900-\u097F]/.test(message)) {
        detectedLanguage = 'Hindi';
        languageInstruction = 'The user is speaking in Hindi. Please respond in Hindi using Devanagari script (\u0900-\u097F). Do not transliterate Hindi into Latin/English characters.';
      }
      // Arabic: \u0600-\u06FF
      else if (/[\u0600-\u06FF]/.test(message)) {
        detectedLanguage = 'Arabic';
        languageInstruction = 'The user is speaking in Arabic. Please respond in Arabic.';
      }
      // Chinese: \u4E00-\u9FFF
      else if (/[\u4E00-\u9FFF]/.test(message)) {
        detectedLanguage = 'Chinese';
        languageInstruction = 'The user is speaking in Chinese. Please respond in Chinese.';
      }
      // Japanese: \u3040-\u30FF
      else if (/[\u3040-\u30FF]/.test(message)) {
        detectedLanguage = 'Japanese';
        languageInstruction = 'The user is speaking in Japanese. Please respond in Japanese.';
      }
      // Korean: \uAC00-\uD7AF
      else if (/[\uAC00-\uD7AF]/.test(message)) {
        detectedLanguage = 'Korean';
        languageInstruction = 'The user is speaking in Korean. Please respond in Korean.';
      }
      // Russian/Cyrillic: \u0400-\u04FF
      else if (/[\u0400-\u04FF]/.test(message)) {
        detectedLanguage = 'Russian';
        languageInstruction = 'The user is speaking in Russian. Please respond in Russian.';
      }
      // Thai: \u0E00-\u0E7F
      else if (/[\u0E00-\u0E7F]/.test(message)) {
        detectedLanguage = 'Thai';
        languageInstruction = 'The user is speaking in Thai. Please respond in Thai.';
      }
      // Spanish
      else if (/[á-úñÁ-ÚÑ]/.test(message)) {
        detectedLanguage = 'Spanish';
        languageInstruction = 'The user is speaking in Spanish. Please respond in Spanish.';
      }
      // French
      else if (/[àèìòùéêëïç]/.test(message)) {
        detectedLanguage = 'French';
        languageInstruction = 'The user is speaking in French. Please respond in French.';
      }

      if (detectedLanguage) {
        console.log(`Detected user input language: ${detectedLanguage}`);
      }

      const contextPrompt = `
        You are a professional bone health assistant helping with medical image analysis results.
        The user is asking about this analysis result: "${taskTitle || 'bone analysis'}"

        Context from the analysis:
        ${analysisContext || 'No analysis data available.'}

        ${languageInstruction}

        Please respond to the user's question in a professional, helpful way. Format your response
        naturally without using markdown. Be direct, informative, and use paragraph breaks for readability.
        Make sure to format important information using HTML <b> tags for bold (not markdown asterisks).
      `;

      const { data, error } = await supabase.functions.invoke('chat-with-gemini', {
        body: {
          message: message,
          context: contextPrompt,
          userType: user?.userType || 'common',
          userId: user?.id,
          analysisId: analysisId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setMessages(prev => prev.filter(msg => !msg.isLoading));

      const botResponse: ChatMessage = {
        text: data.response || "I'm sorry, I couldn't generate a response. Please try again.",
        isUser: false
      };

      setMessages(prev => [...prev, botResponse]);

      // Speak the response if in voice mode
      if (isVoiceMode) {
        // Stop any ongoing speech first
        if (synthRef.current && synthRef.current.speaking) {
          synthRef.current.cancel();
        }
        // Slight delay to ensure UI updates before speaking
        setTimeout(() => {
          speakWithBrowserSynthesis(botResponse.text);
        }, 300);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      setMessages(prev => [...prev, {
        text: "I'm sorry, I encountered an error processing your request. Please try again.",
        isUser: false
      }]);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            onClick={toggleChat}
            className="fixed bottom-6 right-6 rounded-full h-14 w-14 p-0 shadow-xl bg-gradient-to-r from-primary to-primary/80 hover:shadow-primary/20 transition-all duration-300 transform hover:scale-105 z-50"
            size="icon"
          >
            {isOpen ? <X size={24} className="text-primary-foreground" /> : <MessageCircle size={24} className="text-primary-foreground" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px] border-none shadow-none bg-transparent">
          <div className="text-center text-xs text-muted-foreground p-2 bg-background/80 backdrop-blur-sm rounded-lg shadow-sm">
            Ask me anything about your bone health analysis
          </div>
        </PopoverContent>
      </Popover>

      {isOpen && (
        <Card
          className={`fixed ${isMaximized ? 'inset-4 max-h-none' : 'bottom-24 right-6 w-96 max-h-[70vh]'} shadow-xl bg-background/95 backdrop-blur-md border border-primary/10 rounded-xl animate-fade-in z-50 transition-all duration-300 ${className}`}
        >
          <CardHeader className="bg-gradient-to-r from-primary to-primary/80 rounded-t-xl p-4">
            <CardTitle className="text-base flex justify-between items-center text-primary-foreground">
              <div className="flex items-center gap-2">
                <BrainCircuit size={18} className="text-primary-foreground" />
                <span>Bone Health AI Assistant</span>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center mr-2">
                  <Switch
                    id="voice-mode"
                    checked={isVoiceMode}
                    onCheckedChange={setIsVoiceMode}
                    className="data-[state=checked]:bg-white/90"
                  />
                  <Label htmlFor="voice-mode" className="ml-2 text-xs text-primary-foreground">
                    Voice
                  </Label>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMaximize}
                  className="h-8 w-8 text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary/80 transition-all duration-300 transform hover:scale-110"
                >
                  {isMaximized ? <Minimize size={16} /> : <Maximize size={16} />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleChat}
                  className="h-8 w-8 text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary/80 transition-all duration-300 transform hover:scale-110"
                >
                  <X size={16} />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div
              className={`${isMaximized ? 'h-[calc(100vh-14rem)]' : 'h-[40vh]'} overflow-y-auto p-4 space-y-3 scrollbar-none`}
              id="chat-messages"
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.isLoading ? (
                    <div className="max-w-[80%] p-3 rounded-lg bg-muted rounded-tl-none">
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.isUser
                          ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-tr-none shadow-md transition-all duration-300 transform hover:scale-105'
                          : 'bg-muted/80 backdrop-blur-sm rounded-tl-none shadow-sm transition-all duration-300 transform hover:scale-105'
                      }`}
                    >
                      <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
          <CardFooter className="p-3 border-t border-border/20">
            <div className="flex w-full gap-2">
              {isVoiceMode && (
                <div className="relative flex-1">
                  {transcript && (
                    <div className="absolute inset-0 border rounded-full px-4 py-2 text-sm bg-background/50 backdrop-blur-sm overflow-hidden">
                      {transcript}
                    </div>
                  )}
                  <input
                    type="text"
                    value={transcript}
                    readOnly
                    placeholder={isListening ? 'Listening...' : 'Click the microphone to speak...'}
                    className="flex-1 w-full border rounded-full px-4 py-2 text-sm transition-all duration-300 focus:ring-2 focus:ring-primary focus:border-primary bg-background/50 backdrop-blur-sm"
                    disabled={isLoading}
                  />
                </div>
              )}

              {!isVoiceMode && (
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about your analysis..."
                  className="flex-1 border rounded-full px-4 py-2 text-sm transition-all duration-300 focus:ring-2 focus:ring-primary focus:border-primary bg-background/50 backdrop-blur-sm"
                  disabled={isLoading}
                />
              )}

              {isVoiceMode ? (
                <>
                  <Button
                    onClick={toggleListening}
                    size="icon"
                    disabled={isLoading}
                    className={`rounded-full ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-primary to-primary/80 hover:bg-primary/90'} transition-all duration-300 transform hover:scale-110 ${isListening ? 'animate-pulse' : ''}`}
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> :
                     isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </Button>

                  {isSpeaking && (
                    <Button
                      onClick={stopSpeaking}
                      size="icon"
                      className="rounded-full bg-yellow-500 hover:bg-yellow-600 transition-all duration-300 transform hover:scale-110"
                    >
                      <VolumeX size={18} />
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  disabled={isLoading || !message.trim()}
                  className="rounded-full bg-gradient-to-r from-primary to-primary/80 hover:bg-primary/90 transition-all duration-300 transform hover:scale-110"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  );
};  // End of ChatbotButton component

// Create a reference to the speech synthesis outside the component
let globalSynthRef: SpeechSynthesis | null = null;
let globalIsSpeaking = false;
let globalCurrentUtterance: SpeechSynthesisUtterance | null = null;

// Specialized function for Hindi speech
const speakHindi = (text: string) => {
    if (!globalSynthRef) {
      globalSynthRef = window.speechSynthesis;
    }

    if (!globalSynthRef) {
      console.error('Speech synthesis not available');
      return;
    }

    try {
      // Clean up HTML tags for speech
      const cleanText = text.replace(/<[^>]*>/g, '');

      // Extract Hindi text (Devanagari script)
      const hindiRegex = /[\u0900-\u097F\s,.?!]+/g;
      const hindiMatches = cleanText.match(hindiRegex);

      if (!hindiMatches || hindiMatches.length === 0) {
        console.log('No Hindi text found, falling back to regular speech');
        speakWithBrowserSynthesis(text);
        return;
      }

      // Join all Hindi text segments
      const hindiText = hindiMatches.join(' ');
      console.log('Speaking Hindi text:', hindiText.substring(0, 100) + '...');

      // Create utterance specifically for Hindi
      const utterance = new SpeechSynthesisUtterance(hindiText);
      utterance.lang = 'hi-IN';

      // Force reload voices
      const voices = window.speechSynthesis.getVoices();

      // Find the best Hindi voice
      let hindiVoice = null;

      // First try: exact Hindi voice
      const hindiVoices = voices.filter(voice => voice.lang === 'hi-IN');
      if (hindiVoices.length > 0) {
        // Prefer Google Hindi voice
        hindiVoice = hindiVoices.find(voice => voice.name.includes('Google')) || hindiVoices[0];
        console.log('Using Hindi voice:', hindiVoice.name);
      } else {
        // Second try: Indian English voice
        const indianVoices = voices.filter(voice => voice.lang === 'en-IN');
        if (indianVoices.length > 0) {
          hindiVoice = indianVoices[0];
          console.log('Using Indian English voice for Hindi:', hindiVoice.name);
        } else {
          // Last resort: any voice with Hindi in the name
          hindiVoice = voices.find(voice => voice.name.toLowerCase().includes('hindi'));
          if (hindiVoice) {
            console.log('Using voice with Hindi in name:', hindiVoice.name);
          } else {
            // Absolute last resort: default voice
            hindiVoice = voices.find(voice => voice.default) || (voices.length > 0 ? voices[0] : null);
            if (hindiVoice) {
              console.log('Using default voice for Hindi:', hindiVoice.name);
            }
          }
        }
      }

      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }

      // Set optimal rate and pitch for Hindi
      utterance.rate = 0.8; // Slower for Hindi
      utterance.pitch = 1.0;

      // Set up event handlers
      utterance.onstart = () => {
        console.log('Hindi speech started');
        globalIsSpeaking = true;
      };

      utterance.onend = () => {
        console.log('Hindi speech ended');
        globalIsSpeaking = false;
        globalCurrentUtterance = null;
      };

      utterance.onerror = (event) => {
        console.error('Hindi speech error:', event);
        globalIsSpeaking = false;
        globalCurrentUtterance = null;
      };

      // Store reference for stopping
      globalCurrentUtterance = utterance;

      // Cancel any ongoing speech
      if (globalSynthRef.speaking) {
        globalSynthRef.cancel();
      }

      // Speak
      globalSynthRef.speak(utterance);
    } catch (error) {
      console.error('Error with Hindi speech synthesis:', error);
      // Use alert instead of toast since we're outside the component
      alert('Error with Hindi speech synthesis');
      globalIsSpeaking = false;
    }
  };

export default ChatbotButton;
