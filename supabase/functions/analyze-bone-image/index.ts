// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { image, taskId, userType, userId } = await req.json()

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: 'No task ID provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Task information lookup (Task Titles - for descriptions in DB and UI)
    const taskTitles: Record<string, string> = {
      'fracture-detection': 'Bone Fracture Detection',
      'bone-marrow': 'Bone Marrow Cell Classification',
      'osteoarthritis': 'Knee Joint Osteoarthritis Detection',
      'osteoporosis': 'Osteoporosis Stage & BMD Score',
      'bone-age': 'Bone Age Detection',
      'spine-fracture': 'Cervical Spine Fracture Detection',
      'bone-tumor': 'Bone Tumor/Cancer Detection',
      'bone-infection': 'Bone Infection (Osteomyelitis) Detection'
    }

    const taskTitle = taskTitles[taskId] || 'Unknown Analysis Type'

    // Detailed task prompts - EXACTLY as provided by the user - for Gemini instructions
    const taskPrompts: Record<string, Record<string, string>> = {
      'fracture-detection': {
        common: "Analyze the X-ray, MRI, or CT scan image for fractures and classify into different fracture types with detailed severity assessment. The image will be analyzed to check for fractures, identifying the affected bone and the type of break. You will receive an easy-to-understand explanation of the fracture, including its severity and possible effects on movement, provide nutrition plan, steps to recover like remedies and exercises if required.",
        doctor: "Analyze the X-ray, MRI, or CT scan image for fractures and classify into different fracture types with detailed severity assessment. Suggest medical treatment options, possible surgeries, immobilization techniques, and follow-up care strategies, provide nutrition plan, steps to recover like remedies and exercises if required."
      },
      'bone-marrow': {
        common: "Analyze the biopsy or MRI image and classify bone marrow cells into relevant categories, identifying concerning cells. The image will be analyzed to check for abnormalities in bone marrow cells. You will receive a simple explanation of the findings, including whether there are unusual cell changes and what they might indicate, provide nutrition plan, steps to recover like remedies and exercises if required.",
        doctor: "Analyze the biopsy or MRI image and classify bone marrow cells into relevant categories, identifying concerning cells. Provide detailed insights into abnormal cell structures, possible diagnoses, and recommended medical interventions, provide nutrition plan, steps to recover like remedies and exercises if required."
      },
      'osteoarthritis': {
        common: "Analyze the knee X-ray or MRI and classify osteoarthritis severity based on clinical grading. The image will be assessed for signs of knee osteoarthritis, including joint space narrowing and bone changes. You will get an easy-to-understand report on whether osteoarthritis is present and its severity level, along with its impact on knee function, provide nutrition plan, steps to recover like remedies and exercises if required.",
        doctor: "Analyze the knee X-ray or MRI and classify osteoarthritis severity based on clinical grading. Suggest advanced treatments, medications, physiotherapy plans, and surgical options such as knee replacement, provide nutrition plan, steps to recover like remedies and exercises if required."
      },
      'osteoporosis': {
        common: "Analyze the bone X-ray and determine osteoporosis stage with estimated Bone Mineral Density (BMD) score. The scan will be analyzed to determine how strong or weak the bones are and whether osteoporosis is present. You will receive a simple explanation of the results, including whether bone density is lower than normal and what it means for bone health, provide nutrition plan, steps to recover like remedies and exercises if required.",
        doctor: "Analyze the bone X-ray and determine osteoporosis stage with estimated Bone Mineral Density (BMD) score. Recommend specific medications, hormone therapy, and advanced treatments to manage and prevent complications, provide nutrition plan, steps to recover like remedies and exercises if required."
      },
      'bone-age': {
        common: "Analyze the X-ray of a child's hand and predict bone age with insights into growth patterns. The scan will be assessed to check how well the bones are developing compared to the expected growth pattern for the child's age. You will receive an easy-to-understand result explaining whether the bone growth is normal, advanced, or delayed, provide nutrition plan, steps to recover like remedies and exercises if required.",
        doctor: "Analyze the X-ray of a child's hand and predict bone age with insights into growth patterns. Offer insights into growth abnormalities, hormonal imbalances, and necessary medical interventions if delayed growth is detected, provide nutrition plan, steps to recover like remedies and exercises if required."
      },
      'spine-fracture': {
        common: "Analyze the X-ray, MRI, or CT scan of the cervical spine for fractures and provide a severity assessment. The scan will be analyzed for fractures in the neck bones, and you will receive an explanation of the findings. The report will describe whether a fracture is present, its severity, and how it may affect movement or pain levels, provide nutrition plan, steps to recover like remedies and exercises if required.",
        doctor: "Analyze the X-ray, MRI, or CT scan of the cervical spine for fractures and provide a severity assessment. Suggest medical treatment plans, possible surgical options, and rehabilitation strategies for full recovery, provide nutrition plan, steps to recover like remedies and exercises if required."
      },
      'bone-tumor': {
        common: "Analyze the X-ray, MRI, CT scan, or biopsy image for possible bone tumors or cancerous growths. The image will be checked for any unusual growths or masses in the bone, and you will receive a simple explanation of the findings. If any suspicious areas are detected, the report will describe their size, location, and whether they appear concerning, provide nutrition plan, steps to recover like remedies and exercises if required.",
        doctor: "Analyze the X-ray, MRI, CT scan, or biopsy image for possible bone tumors or cancerous growths. Provide detailed insights into tumor classification, possible malignancy assessment, and treatment options, provide nutrition plan, steps to recover like remedies and exercises if required."
      },
      'bone-infection': {
        common: "Analyze the X-ray, MRI, CT scan, or biopsy image for signs of bone infection (osteomyelitis). The image will be checked for any signs of infection in the bone, such as swelling, bone damage, or abscess formation. You will receive an easy-to-understand explanation of whether an infection is present and how it may be affecting the bone, provide nutrition plan, steps to recover like remedies and exercises if required.",
        doctor: "Analyze the X-ray, MRI, CT scan, or biopsy image for signs of bone infection (osteomyelitis). Provide insights on infection severity, possible antibiotic treatments, and surgical recommendations if needed, provide nutrition plan, steps to recover like remedies and exercises if required."
      }
    }

    // Initialize Gemini API - API Key is read from Deno Environment Variables
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase Client - for database interactions and storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Log task processing - for debugging and monitoring
    console.log(`Processing ${taskId} task with Gemini AI...`)

    // Gemini  API Endpoint - Model is explicitly set to 'gemini-2.0-flash-thinking-exp-01-21'
    const baseURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp-01-21:generateContent"
    const url = `${baseURL}?key=${apiKey}`

    // Data URI to Base64 Conversion - Extracts base64 image data from Data URI format
    let base64Data = image
    if (image.includes('base64,')) {
      base64Data = image.split('base64,')[1]
    }

    // Prompt Selection - Chooses prompt based on task ID and user type (common/doctor)
    const userCategory = userType === 'doctor' ? 'doctor' : 'common'
    const promptText = taskPrompts[taskId]?.[userCategory] || `Analyze this medical image for ${taskTitle}.`

    // Formatting Instruction - Ensures Gemini uses HTML bold tags in the response
    const formattingInstruction = "Make sure to format important information using HTML <b> tags for bold (not markdown asterisks)."

    // Gemini API Request Payload - Structured request body for Gemini API
    const payload = {
      contents: [
        {
          parts: [
            { text: promptText + " " + formattingInstruction },
            {
              inline_data: {
                mime_type: "image/jpeg", // Assuming JPEG images for now
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4, // Lower temperature for more deterministic and focused responses
        maxOutputTokens: 1024, // Increased maxOutputTokens for potentially longer analysis results
      }
    }

    // Log API Request Model -  For transparency, logging which model is being called
    console.log(`Sending request to Gemini with model: gemini-2.0-flash-thinking-exp-01-21`);

    // Gemini API Call -  Fetch request to the Gemini API
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })

    // Gemini API Response Error Handling - Checks for HTTP errors from Gemini API
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API error:", errorText)
      throw new Error(`Gemini API error: ${response.status} ${errorText}`)
    }

    // Parse Gemini API Response - Parses JSON response from Gemini API
    const data = await response.json()

    // Gemini API No Candidates Check - Checks if Gemini returned any valid candidates in the response
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response generated by the model")
    }

    // Extract Analysis Text - Extracts the text analysis from Gemini's response
    const analysisText = data.candidates[0].content.parts[0].text

    // Initialize Storage Variables - Variables to store image URL and analysis ID
    let imageUrl = null
    let analysisId = null

    // Database Storage - Stores analysis results, image (optionally) in Supabase
    if (userId && analysisText) {
      try {
        // Image Storage in Supabase Storage (Conditional) - Stores image in Supabase Storage if image data is available
        if (image) {
          // Bucket Existence Check - Checks if the storage bucket exists, creates it if not
          const { data: buckets } = await supabase.storage.listBuckets()
          const bucketName = 'bone-analysis-images'

          if (!buckets?.find(b => b.name === bucketName)) {
            await supabase.storage.createBucket(bucketName, {
              public: false, // Bucket is private for security
              fileSizeLimit: 5242880 // 5MB file size limit
            })
          }

          // Unique File Name Generation - Creates a unique file name to avoid collisions
          const fileName = `${userId}/${taskId}/${Date.now()}.jpg`

          // Image Upload to Supabase Storage - Uploads the base64 image data to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, Buffer.from(base64Data, 'base64'), {
              contentType: 'image/jpeg',
              upsert: true // Overwrites file if it already exists (for updates if needed)
            })

          // Image Upload Error Handling - Handles errors during image upload to Supabase Storage
          if (uploadError) {
            console.error("Error uploading image:", uploadError)
          } else if (uploadData) {
            // Public URL Retrieval - Gets the public URL of the uploaded image from Supabase Storage
            const { data: publicUrlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(fileName)

            imageUrl = publicUrlData?.publicUrl || null // Assigns public URL if available
          }
        }

        // Analysis Data Insertion to Supabase DB - Stores analysis metadata and results in 'analyses' table
        const { data: analysisData, error: insertError } = await supabase
          .from('analyses')
          .insert({
            user_id: userId,
            task_id: taskId,
            task_name: taskTitle,
            result_text: analysisText,
            image_url: imageUrl
          })
          .select() // Select data after insert to get the new analysis ID

        // Analysis Data Insertion Error Handling - Handles errors during analysis data insertion
        if (insertError) {
          console.error("Error storing analysis:", insertError)
        } else if (analysisData && analysisData.length > 0) {
          analysisId = analysisData[0].id // Extracts the newly created analysis ID
          console.log("Analysis stored successfully with ID:", analysisId)
        }
      } catch (storageError) {
        console.error("Error in storage process:", storageError) // Catches any errors during storage operations
      }
    }

    // Return Analysis Result - Returns the analysis text, analysis ID, and image URL in the HTTP response
    return new Response(
      JSON.stringify({
        analysis: analysisText,
        analysisId,
        imageUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Error processing image:", error) // General error handler for the entire function
    return new Response(
      JSON.stringify({ error: `Failed to process the image: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
