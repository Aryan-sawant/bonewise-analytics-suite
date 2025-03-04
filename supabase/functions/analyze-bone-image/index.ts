
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle CORS preflight requests
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the request body
    const { image, taskId, userType } = await req.json()

    // Validate required parameters
    if (!image || !taskId || !userType) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Extract base64 image data (remove data:image/jpeg;base64, prefix)
    const imageData = image.split(',')[1]
    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'Invalid image format' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Get the API key from environment variables
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is not set in environment variables')
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Task prompts for different analysis types
    const task_prompts = {
      "fracture-detection": (
        "Analyze the X-ray, MRI, or CT scan image for fractures and classify into different fracture types with detailed severity assessment. "
        + (userType === 'common' ? 
          "The image will be analyzed to check for fractures, identifying the affected bone and the type of break. "
          + "You will receive an easy-to-understand explanation of the fracture, including its severity and possible effects on movement, provide nutrition plan, steps to recover like remedies and exercises if required. " :
          "Suggest medical treatment options, possible surgeries, immobilization techniques, and follow-up care strategies, provide nutrition plan, steps to recover like remedies and exercises if required. ")
      ),
      "bone-marrow": (
        "Analyze the biopsy or MRI image and classify bone marrow cells into relevant categories, identifying concerning cells. "
        + (userType === 'common' ? 
          "The image will be analyzed to check for abnormalities in bone marrow cells. "
          + "You will receive a simple explanation of the findings, including whether there are unusual cell changes and what they might indicate, provide nutrition plan, steps to recover like remedies and exercises if required. " :
          "Provide detailed insights into abnormal cell structures, possible diagnoses, and recommended medical interventions, provide nutrition plan, steps to recover like remedies and exercises if required. ")
      ),
      "osteoarthritis": (
        "Analyze the knee X-ray or MRI and classify osteoarthritis severity based on clinical grading. "
        + (userType === 'common' ? 
          "The image will be assessed for signs of knee osteoarthritis, including joint space narrowing and bone changes. "
          + "You will get an easy-to-understand report on whether osteoarthritis is present and its severity level, along with its impact on knee function, provide nutrition plan, steps to recover like remedies and exercises if required. " :
          "Suggest advanced treatments, medications, physiotherapy plans, and surgical options such as knee replacement, provide nutrition plan, steps to recover like remedies and exercises if required. ")
      ),
      "osteoporosis": (
        "Analyze the bone X-ray and determine osteoporosis stage with estimated Bone Mineral Density (BMD) score. "
        + (userType === 'common' ? 
          "The scan will be analyzed to determine how strong or weak the bones are and whether osteoporosis is present. "
          + "You will receive a simple explanation of the results, including whether bone density is lower than normal and what it means for bone health, provide nutrition plan, steps to recover like remedies and exercises if required. " :
          "Recommend specific medications, hormone therapy, and advanced treatments to manage and prevent complications, provide nutrition plan, steps to recover like remedies and exercises if required. ")
      ),
      "bone-age": (
        "Analyze the X-ray of a child's hand and predict bone age with insights into growth patterns. "
        + (userType === 'common' ? 
          "The scan will be assessed to check how well the bones are developing compared to the expected growth pattern for the child's age. "
          + "You will receive an easy-to-understand result explaining whether the bone growth is normal, advanced, or delayed, provide nutrition plan, steps to recover like remedies and exercises if required. " :
          "Offer insights into growth abnormalities, hormonal imbalances, and necessary medical interventions if delayed growth is detected, provide nutrition plan, steps to recover like remedies and exercises if required. ")
      ),
      "spine-fracture": (
        "Analyze the X-ray, MRI, or CT scan of the cervical spine for fractures and provide a severity assessment. "
        + (userType === 'common' ? 
          "The scan will be analyzed for fractures in the neck bones, and you will receive an explanation of the findings. "
          + "The report will describe whether a fracture is present, its severity, and how it may affect movement or pain levels, provide nutrition plan, steps to recover like remedies and exercises if required. " :
          "Suggest medical treatment plans, possible surgical options, and rehabilitation strategies for full recovery, provide nutrition plan, steps to recover like remedies and exercises if required. ")
      ),
      "bone-tumor": (
        "Analyze the X-ray, MRI, CT scan, or biopsy image for possible bone tumors or cancerous growths. "
        + (userType === 'common' ? 
          "The image will be checked for any unusual growths or masses in the bone, and you will receive a simple explanation of the findings. "
          + "If any suspicious areas are detected, the report will describe their size, location, and whether they appear concerning, provide nutrition plan, steps to recover like remedies and exercises if required. " :
          "Provide detailed insights into tumor classification, possible malignancy assessment, and treatment options, provide nutrition plan, steps to recover like remedies and exercises if required. ")
      ),
      "bone-infection": (
        "Analyze the X-ray, MRI, CT scan, or biopsy image for signs of bone infection (osteomyelitis). "
        + (userType === 'common' ? 
          "The image will be checked for any signs of infection in the bone, such as swelling, bone damage, or abscess formation. "
          + "You will receive an easy-to-understand explanation of whether an infection is present and how it may be affecting the bone, provide nutrition plan, steps to recover like remedies and exercises if required. " :
          "Provide insights on infection severity, possible antibiotic treatments, and surgical recommendations if needed, provide nutrition plan, steps to recover like remedies and exercises if required. ")
      )
    };

    // Select the appropriate prompt based on taskId
    const promptText = task_prompts[taskId as keyof typeof task_prompts] || 
      "Analyze this medical bone image and provide detailed insights about what you see.";

    console.log(`Processing ${taskId} task for ${userType} user`);

    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-thinking-exp-01-21"
    });

    // Prepare the content parts
    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: "image/jpeg"
      }
    };

    // Generate content with the image and prompt
    const result = await model.generateContent([
      promptText,
      imagePart
    ]);

    const response = result.response;
    const text = response.text();

    console.log("Analysis complete");

    return new Response(
      JSON.stringify({ result: text }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    
    return new Response(
      JSON.stringify({ error: `Analysis failed: ${error.message}` }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
})
