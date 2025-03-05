
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Define task-specific prompts for different bone analysis tasks
const TASK_PROMPTS = {
  'fracture-detection': 
    "Analyze the X-ray, MRI, or CT scan image for fractures and classify into different fracture types with detailed severity assessment. " +
    "For common users: The image will be analyzed to check for fractures, identifying the affected bone and the type of break. " +
    "You will receive an easy-to-understand explanation of the fracture, including its severity and possible effects on movement, provide nutrition plan,steps to recover like remedies and exercises if required. " +
    "For doctors: Suggest medical treatment options, possible surgeries, immobilization techniques, and follow-up care strategies,provide nutrition plan,steps to recover like remedies and exercises if required. ",

  'bone-marrow': 
    "Analyze the biopsy or MRI image and classify bone marrow cells into relevant categories, identifying concerning cells. " +
    "For common users: The image will be analyzed to check for abnormalities in bone marrow cells. " +
    "You will receive a simple explanation of the findings, including whether there are unusual cell changes and what they might indicate,provide nutrition plan,steps to recover like remedies and exercises if required. " +
    "For doctors: Provide detailed insights into abnormal cell structures, possible diagnoses, and recommended medical interventions,provide nutrition plan,steps to recover like remedies and exercises if required. ",

  'osteoarthritis': 
    "Analyze the knee X-ray or MRI and classify osteoarthritis severity based on clinical grading. " +
    "For common users: The image will be assessed for signs of knee osteoarthritis, including joint space narrowing and bone changes. " +
    "You will get an easy-to-understand report on whether osteoarthritis is present and its severity level, along with its impact on knee function,provide nutrition plan,steps to recover like remedies and exercises if required. " +
    "For doctors: Suggest advanced treatments, medications, physiotherapy plans, and surgical options such as knee replacement,provide nutrition plan,steps to recover like remedies and exercises if required.",

  'osteoporosis': 
    "Analyze the bone X-ray and determine osteoporosis stage with estimated Bone Mineral Density (BMD) score. " +
    "For common users: The scan will be analyzed to determine how strong or weak the bones are and whether osteoporosis is present. " +
    "You will receive a simple explanation of the results, including whether bone density is lower than normal and what it means for bone health,provide nutrition plan,steps to recover like remedies and exercises if required. " +
    "For doctors: Recommend specific medications, hormone therapy, and advanced treatments to manage and prevent complications,provide nutrition plan,steps to recover like remedies and exercises if required.",

  'bone-age': 
    "Analyze the X-ray of a child's hand and predict bone age with insights into growth patterns. " +
    "For common users: The scan will be assessed to check how well the bones are developing compared to the expected growth pattern for the child's age. " +
    "You will receive an easy-to-understand result explaining whether the bone growth is normal, advanced, or delayed,provide nutrition plan,steps to recover like remedies and exercises if required. " +
    "For doctors: Offer insights into growth abnormalities, hormonal imbalances, and necessary medical interventions if delayed growth is detected,provide nutrition plan,steps to recover like remedies and exercises if required.",

  'spine-fracture': 
    "Analyze the X-ray, MRI, or CT scan of the cervical spine for fractures and provide a severity assessment. " +
    "For common users: The scan will be analyzed for fractures in the neck bones, and you will receive an explanation of the findings. " +
    "The report will describe whether a fracture is present, its severity, and how it may affect movement or pain levels,provide nutrition plan,steps to recover like remedies and exercises if required. " +
    "For doctors: Suggest medical treatment plans, possible surgical options, and rehabilitation strategies for full recovery,provide nutrition plan,steps to recover like remedies and exercises if required.",

  'bone-tumor': 
    "Analyze the X-ray, MRI, CT scan, or biopsy image for possible bone tumors or cancerous growths. " +
    "For common users: The image will be checked for any unusual growths or masses in the bone, and you will receive a simple explanation of the findings. " +
    "If any suspicious areas are detected, the report will describe their size, location, and whether they appear concerning,provide nutrition plan,steps to recover like remedies and exercises if required. " +
    "For doctors: Provide detailed insights into tumor classification, possible malignancy assessment, and treatment options,provide nutrition plan,steps to recover like remedies and exercises if required. ",

  'bone-infection': 
    "Analyze the X-ray, MRI, CT scan, or biopsy image for signs of bone infection (osteomyelitis). " +
    "For common users: The image will be checked for any signs of infection in the bone, such as swelling, bone damage, or abscess formation. " +
    "You will receive an easy-to-understand explanation of whether an infection is present and how it may be affecting the bone,provide nutrition plan,steps to recover like remedies and exercises if required. " +
    "For doctors: Provide insights on infection severity, possible antibiotic treatments, and surgical recommendations if needed,provide nutrition plan,steps to recover like remedies and exercises if required."
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract the image data, taskId, and userType from the request
    const { image, taskId, userType } = await req.json();

    if (!image) {
      throw new Error('No image provided');
    }

    if (!taskId || !TASK_PROMPTS[taskId]) {
      throw new Error('Invalid or missing taskId');
    }

    console.log(`Processing ${taskId} analysis for ${userType} user`);

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    
    // Use the specific model requested
    const modelName = "gemini-2.0-flash-thinking-exp-01-21";
    const model = genAI.getGenerativeModel({ model: modelName });

    // Prepare the image data
    const imageData = {
      inlineData: {
        data: image.split(',')[1], // Remove the data URL prefix
        mimeType: "image/jpeg"
      }
    };

    // Get the task-specific prompt
    let prompt = TASK_PROMPTS[taskId];
    
    // Tailor the prompt based on user type
    if (userType === 'doctor') {
      prompt += "\nAs you're a medical professional, please provide detailed clinical analysis with medical terminology.";
    } else {
      prompt += "\nPlease explain this in simple terms as I'm not a medical professional.";
    }

    console.log('Sending request to Gemini API with task:', taskId);

    // Set up generation config
    const generationConfig = {
      temperature: 0.1,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    };

    // Generate content
    const result = await model.generateContent([prompt, imageData], { generationConfig });
    const response = await result.response;
    const text = response.text();

    console.log('Received response from Gemini API');

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

Deno.serve(handler);
