
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

// Task-specific prompts for different bone health analyses
const TASK_PROMPTS: Record<string, string> = {
  "fracture-detection": 
    "Analyze the X-ray, MRI, or CT scan image for fractures and classify into different fracture types with detailed severity assessment. " +
    "For common users: The image will be analyzed to check for fractures, identifying the affected bone and the type of break. " +
    "You will receive an easy-to-understand explanation of the fracture, including its severity and possible effects on movement, provide nutrition plan,steps to recover like remedies and exercises if required. " +
    "For doctors: Suggest medical treatment options, possible surgeries, immobilization techniques, and follow-up care strategies,provide nutrition plan,steps to recover like remedies and exercises if required. ",

  "bone-marrow": 
    "Analyze the biopsy or MRI image and classify bone marrow cells into relevant categories, identifying concerning cells. " +
    "For common users: The image will be analyzed to check for abnormalities in bone marrow cells. " +
    "You will receive a simple explanation of the findings, including whether there are unusual cell changes and what they might indicate,provide nutrition plan,steps to recover like remedies and exercises if required. " +
    "For doctors: Provide detailed insights into abnormal cell structures, possible diagnoses, and recommended medical interventions,provide nutrition plan,steps to recover like remedies and exercises if required. ",

  "osteoarthritis": 
    "Analyze the knee X-ray or MRI and classify osteoarthritis severity based on clinical grading. " +
    "For common users: The image will be assessed for signs of knee osteoarthritis, including joint space narrowing and bone changes. " +
    "You will get an easy-to-understand report on whether osteoarthritis is present and its severity level, along with its impact on knee function,provide nutrition plan,steps to recover like remedies and exercises if required. " +
    "For doctors: Suggest advanced treatments, medications, physiotherapy plans, and surgical options such as knee replacement,provide nutrition plan,steps to recover like remedies and exercises if required.",
    
  "osteoporosis": 
    "Analyze the bone X-ray and determine osteoporosis stage with estimated Bone Mineral Density (BMD) score. " +
    "For common users: The scan will be analyzed to determine how strong or weak the bones are and whether osteoporosis is present. " +
    "You will receive a simple explanation of the results, including whether bone density is lower than normal and what it means for bone health,provide nutrition plan,steps to recover like remedies and exercises if required. " +
    "For doctors: Recommend specific medications, hormone therapy, and advanced treatments to manage and prevent complications,provide nutrition plan,steps to recover like remedies and exercises if required.",

  "bone-age": 
    "Analyze the X-ray of a child's hand and predict bone age with insights into growth patterns. " +
    "For common users: The scan will be assessed to check how well the bones are developing compared to the expected growth pattern for the child's age. " +
    "You will receive an easy-to-understand result explaining whether the bone growth is normal, advanced, or delayed,provide nutrition plan,steps to recover like remedies and exercises if required. " +
    "For doctors: Offer insights into growth abnormalities, hormonal imbalances, and necessary medical interventions if delayed growth is detected,provide nutrition plan,steps to recover like remedies and exercises if required.",

  "spine-fracture": 
    "Analyze the X-ray, MRI, or CT scan of the cervical spine for fractures and provide a severity assessment. " +
    "For common users: The scan will be analyzed for fractures in the neck bones, and you will receive an explanation of the findings. " +
    "The report will describe whether a fracture is present, its severity, and how it may affect movement or pain levels,provide nutrition plan,steps to recover like remedies and exercises if required. " +
    "For doctors: Suggest medical treatment plans, possible surgical options, and rehabilitation strategies for full recovery,provide nutrition plan,steps to recover like remedies and exercises if required.",

  "bone-tumor": 
    "Analyze the X-ray, MRI, CT scan, or biopsy image for possible bone tumors or cancerous growths. " +
    "For common users: The image will be checked for any unusual growths or masses in the bone, and you will receive a simple explanation of the findings. " +
    "If any suspicious areas are detected, the report will describe their size, location, and whether they appear concerning,provide nutrition plan,steps to recover like remedies and exercises if required. " +
    "For doctors: Provide detailed insights into tumor classification, possible malignancy assessment, and treatment options,provide nutrition plan,steps to recover like remedies and exercises if required. ",

  "bone-infection": 
    "Analyze the X-ray, MRI, CT scan, or biopsy image for signs of bone infection (osteomyelitis). " +
    "For common users: The image will be checked for any signs of infection in the bone, such as swelling, bone damage, or abscess formation. " +
    "You will receive an easy-to-understand explanation of whether an infection is present and how it may be affecting the bone,provide nutrition plan,steps to recover like remedies and exercises if required. " +
    "For doctors: Provide insights on infection severity, possible antibiotic treatments, and surgical recommendations if needed,provide nutrition plan,steps to recover like remedies and exercises if required."
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Gemini API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { image, taskId, userType } = await req.json();
    
    if (!image || !taskId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: image and taskId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the appropriate prompt based on task
    const prompt = TASK_PROMPTS[taskId] || 
      "Analyze this medical image of bone and provide insights. " + 
      (userType === 'doctor' 
        ? "Give a detailed clinical assessment with technical medical terminology." 
        : "Provide a simple explanation in layman's terms.");

    // Create a specialized system prompt for the user type
    const systemPrompt = userType === 'doctor' 
      ? "You are a bone health AI assistant for medical professionals. Provide detailed, technical analysis using medical terminology."
      : "You are a bone health AI assistant for patients. Explain findings in simple, non-technical language that's easy to understand.";

    console.log(`Analyzing image for task: ${taskId}, user type: ${userType}`);

    // Call the Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-thinking-exp-01-21:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: systemPrompt },
              { text: prompt },
              { 
                inline_data: {
                  mime_type: "image/jpeg",
                  data: image.replace(/^data:image\/\w+;base64,/, '')
                } 
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    const data = await response.json();
    console.log("Gemini API response received");

    // Extract the result text from the Gemini response
    let result;
    try {
      result = data.candidates[0].content.parts[0].text;
    } catch (err) {
      console.error("Error parsing Gemini response:", err);
      console.error("Gemini response structure:", JSON.stringify(data, null, 2));
      throw new Error("Failed to parse Gemini API response");
    }

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing image analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to analyze image' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
