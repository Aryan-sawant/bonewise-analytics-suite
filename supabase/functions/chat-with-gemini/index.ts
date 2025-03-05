
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract the message, context, and userType from the request
    const { message, context, userType } = await req.json();

    if (!message) {
      throw new Error('No message provided');
    }

    console.log(`Processing chat message for ${userType} user`);

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    
    // Use the model
    const modelName = "gemini-2.0-flash-thinking-exp-01-21";
    const model = genAI.getGenerativeModel({ model: modelName });

    // Create the full prompt
    let basePrompt = `You are a professional bone health assistant providing information about medical image analysis results.
    You are friendly, helpful, and knowledgeable but always clear that you are an AI assistant.
    Format your responses in a clean, readable way without using markdown syntax like **bold** or __italics__.
    Be concise but thorough.`;

    // Adjust based on user type
    if (userType === 'doctor') {
      basePrompt += `\nThe user is a medical professional, so you can use medical terminology and provide detailed clinical information.`;
    } else {
      basePrompt += `\nThe user is not a medical professional, so explain things in simple terms while still being accurate.`;
    }

    // Combine the base prompt, context, and user message
    const fullPrompt = `${basePrompt}\n\n${context || ''}\n\nUser message: ${message}`;
    
    console.log('Sending request to Gemini API');

    // Set up generation config
    const generationConfig = {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 1024,
    };

    // Generate content
    const result = await model.generateContent(fullPrompt, { generationConfig });
    const response = await result.response;
    const text = response.text();

    console.log('Received response from Gemini API');

    return new Response(
      JSON.stringify({ response: text }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Error in chat-with-gemini function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

Deno.serve(handler);
