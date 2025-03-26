// analyze-bone-image function in Supabase Functions

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

    // Detailed task prompts - EXACTLY as provided by the user
    const taskPrompts: Record<string, Record<string, string>> = {
      'fracture-detection': {
        common: "Analyze the X-ray, MRI, or CT scan image to assess for fractures. Identify the affected bone and classify the fracture exclusively according to the AO/OTA Fracture and Dislocation Classification system. Provide a simplified explanation of the AO/OTA classification assigned. Determine the severity of the fracture based on the AO/OTA classification and imaging findings. Provide an easy-to-understand explanation of the fracture, including its potential effects on movement and expected recovery timeline, considering the AO/OTA classification. Please also suggest a basic nutrition plan and recovery steps, including remedies, exercises and when can the person drive or work if appropriate, in the context of the AO/OTA classified fracture.",
        doctor: "Analyze the X-ray, MRI, or CT scan image to assess for fractures. Identify the affected bone and classify the fracture exclusively according to the AO/OTA Fracture and Dislocation Classification system. Provide a detailed and comprehensive explanation of the specific AO/OTA classification assigned, including the relevant alphanumeric codes and their precise meaning in terms of fracture morphology, anatomical location, and severity. Based solely on the AO/OTA classification and imaging findings, suggest appropriate medical treatment options, including potential surgical interventions, immobilization techniques, and follow-up care strategies. Also, provide a relevant nutrition plan and recommend specific rehabilitation exercises and remedies as needed and when can the person drive or work, directly informed by the AO/OTA fracture classification and its severity."
      },
      'bone-marrow': {
        common: "Analyze the microscopic biopsy or MRI image of bone marrow cells. Classify the bone marrow cells into relevant categories like Abnormal eosinophil, Artefact, Basophil, Blast, Erythroblast, Eosinophil, Faggott cell, Hairy cell, Smudge cell, Immature lymphocyte, Lymphocyte, Metamyelocyte, Monocyte, Myelocyte, Band neutrophil, Segmented neutrophil, Not identifiable, Other cell, Proerythroblast, Plasma cell, Promyelocyte and identify any concerning or abnormal cells. Explain your findings in simple terms, indicating any unusual cell changes and their potential implications. Provide a nutrition plan and steps to recover, including remedies, exercises and when can the person drive or work if required.",
        doctor: "Analyze the microscopic biopsy or MRI image of bone marrow cells. Classify bone marrow cells into detailed categories like Abnormal eosinophil, Artefact, Basophil, Blast, Erythroblast, Eosinophil, Faggott cell, Hairy cell, Smudge cell, Immature lymphocyte, Lymphocyte, Metamyelocyte, Monocyte, Myelocyte, Band neutrophil, Segmented neutrophil, Not identifiable, Other cell, Proerythroblast, Plasma cell, Promyelocyte, identifying and describing any abnormal cell structures. Provide insights into possible diagnoses and recommend medical interventions, nutrition plans, and recovery steps, including remedies, exercises and when can the person drive or work if required."
      },
      'osteoarthritis': {
        common: "Analyze the knee X-ray or MRI and classify osteoarthritis severity based on Kellgren-Lawrence (K-L) clinical grading like Grade 0: Healthy knee image, Grade 1 (Doubtful): Doubtful joint narrowing with possible osteophytic lipping, Grade 2 (Minimal): Definite presence of osteophytes and possible joint space narrowing, Grade 3 (Moderate): Multiple osteophytes, definite joint space narrowing, with mild sclerosis, Grade 4 (Severe): Large osteophytes, significant joint narrowing, and severe sclerosis. The image will be assessed for signs of knee osteoarthritis, including joint space narrowing and bone changes. You will get an easy-to-understand report on whether osteoarthritis is present and its severity level, along with its impact on knee function, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required.",
        doctor: "Analyze the knee X-ray or MRI and classify osteoarthritis severity based on Kellgren-Lawrence (K-L) clinical grading like Grade 0: Healthy knee image, Grade 1 (Doubtful): Doubtful joint narrowing with possible osteophytic lipping, Grade 2 (Minimal): Definite presence of osteophytes and possible joint space narrowing, Grade 3 (Moderate): Multiple osteophytes, definite joint space narrowing, with mild sclerosis, Grade 4 (Severe): Large osteophytes, significant joint narrowing, and severe sclerosis. Suggest advanced treatments, medications, physiotherapy plans, and surgical options such as knee replacement, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required."
      },
      'osteoporosis': {
        common: "Analyze the bone X-ray and determine osteoporosis stage categorized into normal, osteopenia and osteoporosis with estimated Bone Mineral Density (BMD) score. The scan will be analyzed to determine how strong or weak the bones are and whether osteoporosis is present. You will receive a simple explanation of the results, including whether bone density is lower than normal and what it means for bone health, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required.",
        doctor: "Analyze the bone X-ray and determine osteoporosis stage categorized into normal, osteopenia and osteoporosis with estimated Bone Mineral Density (BMD) score. Recommend specific medications, hormone therapy, and advanced treatments to manage and prevent complications, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required."
      },
      'bone-age': {
        common: "Analyze the X-ray of a child's hand and predict bone age with insights into growth patterns and offering exact age number or range based on Greulich-Pyle (GP) Atlas and	Tanner-Whitehouse (TW) Method. The scan will be assessed to check how well the bones are developing compared to the expected growth pattern for the child's age. You will receive an easy-to-understand result with exact age number or range explaining whether the bone growth is normal, advanced, or delayed, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required.",
        doctor: "Analyze the X-ray of a child's hand and predict bone age with insights into growth patterns and offering exact age number or range based on Greulich-Pyle (GP) Atlas and Tanner-Whitehouse (TW) Method. Offer insights into growth abnormalities, hormonal imbalances, and necessary medical interventions if delayed growth is detected, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required."
      },
      'spine-fracture': {
        common: "Analyze the X-ray, MRI, or CT scan of the cervical spine for fractures based on the AO/OTA Fracture and Dislocation Classification system. The scan will be analyzed for fractures in the neck bones, and you will receive an explanation of the findings. The report will describe whether a fracture is present, its severity, and how it may affect movement or pain levels, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required.",
        doctor: "Analyze the X-ray, MRI, or CT scan of the cervical spine for fractures based on the AO/OTA Fracture and Dislocation Classification system. Suggest medical treatment plans, possible surgical options, and rehabilitation strategies for full recovery, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required."
      },
      'bone-tumor': {
        common: "Analyze the X-ray, MRI, CT scan, or biopsy image for possible bone tumors or cancerous growths. The image will be checked for any unusual growths or masses in the bone, and you will receive a simple explanation of the findings. If any suspicious areas are detected, the report will describe their size, location, and whether they appear concerning, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required.",
        doctor: "Analyze the X-ray, MRI, CT scan, or biopsy image for possible bone tumors or cancerous growths. Provide detailed insights into tumor classification, possible malignancy assessment, and treatment options, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required."
      },
      'bone-infection': {
        common: "Analyze the X-ray, MRI, CT scan, or biopsy image for signs of bone infection (osteomyelitis). The image will be checked for any signs of infection in the bone, such as swelling, bone damage, or abscess formation. You will receive an easy-to-understand explanation of whether an infection is present and how it may be affecting the bone, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required.",
        doctor: "Analyze the X-ray, MRI, CT scan, or biopsy image for signs of bone infection (osteomyelitis). Provide insights on infection severity, possible antibiotic treatments, and surgical recommendations if needed, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required."
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

    // Gemini  API Endpoint - Model is explicitly set to 'gemini-2.5-pro-exp-03-25'
    const baseURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent"
    const url = `${baseURL}?key=${apiKey}`

    // Data URI to Base64 Conversion - Extracts base64 image data from Data URI format
    let base64Data = image
    if (image.includes('base64,')) {
      base64Data = image.split('base64,')[1]
    }

    // Prompt Selection - Chooses prompt based on task ID and user type (common/doctor)
    const userCategory = userType === 'doctor' ? 'doctor' : 'common'
    const promptText = taskPrompts[taskId]?.[userCategory] || `Analyze this medical image for ${taskTitle}.`

    // Formatting Instruction - Ensures Gemini uses HTML <b> tags in the response
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
        temperature: 0.0, // Lower temperature for more deterministic and focused responses
        maxOutputTokens: 1048576, // Increased maxOutputTokens for potentially longer analysis results
      }
    }

    // Log API Request Model -  For transparency, logging which model is being called
    console.log(`Sending request to Gemini with model: gemini-2.5-pro-exp-03-25`);

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
      console.error("Gemini API full response:", response) // Log the full response for more details
      try {
        const errorJson = await response.json();
        console.error("Gemini API error JSON:", errorJson); // Try to log JSON error if available
      } catch (jsonError) {
        console.error("Failed to parse Gemini error JSON:", jsonError);
      }
      throw new Error(`Gemini API error: ${response.status} ${errorText}`)
    }

    // Parse Gemini API Response - Parses JSON response from Gemini API
    const data = await response.json()

    // Gemini API No Candidates Check - Checks if Gemini returned any valid candidates in the response
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response generated by the model")
    }

    // Extract Analysis Text - Extracts the text analysis from Gemini's response
    let analysisText = data.candidates[0].content.parts[0].text;

    // Remove asterisks for bold if they are present, assuming Gemini might still use them sometimes.
    // Replace markdown bold (**) with HTML bold tags. This is a fallback in case Gemini uses markdown.
    analysisText = analysisText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    // Remove any remaining single asterisks that might be around words.
    analysisText = analysisText.replace(/\*(.*?)\*/g, '<b>$1</b>');
    // Remove any standalone asterisks that are not part of bold formatting.
    analysisText = analysisText.replace(/\*/g, '');


    // **IMPORTANT LOGGING FOR DEBUGGING TRUNCATION - PLEASE PROVIDE THESE LOGS**
    console.log("Full Gemini analysisText (before DB storage):", analysisText);

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

          // Image Upload to Supabase Storage - Uploads the image using Deno-compatible method
          const base64ImageData = image.split('base64,')[1];
          const imageBuffer = Uint8Array.from(atob(base64ImageData), c => c.charCodeAt(0));


          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, imageBuffer, {  // Use imageBuffer (Uint8Array) here
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
