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
    // Extract the image data and userType from the request
    const { image, userType } = await req.json();

    if (!image) {
      throw new Error('No image provided');
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    // Prepare the image data
    const imageData = {
      inlineData: {
        data: image.split(',')[1], // Remove the data URL prefix
        mimeType: "image/jpeg"
      }
    };

    // Customize the prompt based on user type
    const prompt = userType === 'doctor' 
      ? "Analyze this bone image in detail. Provide a comprehensive medical assessment including potential fractures, bone density issues, and other relevant medical observations. Use medical terminology."
      : "Analyze this bone image and explain the findings in simple, easy-to-understand terms. Focus on basic observations and avoid complex medical terminology.";

    console.log('Sending request to Gemini API with prompt:', prompt);

    // Generate content
    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    const text = response.text();

    console.log('Received response from Gemini API:', text);

    return new Response(
      JSON.stringify({ analysis: text }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Error in analyze-bone-image function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
