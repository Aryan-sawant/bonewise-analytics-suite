
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

    // Task information lookup
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

    // Define detailed task prompts exactly as provided by the user
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

    // Initialize Gemini API
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Call Gemini API to analyze the image
    console.log(`Processing ${taskId} task with Gemini 2.0 Flash Thinking model...`)

    // Use the specified model
    const baseURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp-01-21:generateContent"
    const url = `${baseURL}?key=${apiKey}`

    // Extract the base64 data from the data URI
    let base64Data = image
    if (image.includes('base64,')) {
      base64Data = image.split('base64,')[1]
    }

    // Get the appropriate prompt based on task ID and user type
    const userCategory = userType === 'doctor' ? 'doctor' : 'common'
    const promptText = taskPrompts[taskId]?.[userCategory] || `Analyze this medical image for ${taskTitle}.`

    // Add instruction for using HTML bold tags instead of markdown
    const formattingInstruction = "Make sure to format important information using HTML <b> tags for bold (not markdown asterisks)."

    // Prepare the request to Gemini
    const payload = {
      contents: [
        {
          parts: [
            { text: promptText + " " + formattingInstruction },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      }
    }

    console.log(`Sending request to Gemini with model: gemini-2.0-flash-thinking-exp-01-21`);
    
    // Call the Gemini API
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API error:", errorText)
      throw new Error(`Gemini API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    console.log("API response:", JSON.stringify(data))
    
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
      // If there's an error with the specific model, fall back to gemini-pro-vision
      console.log("No response from gemini-2.0-flash-thinking-exp-01-21, falling back to gemini-pro-vision")
      
      // Use gemini-pro-vision as fallback
      const fallbackBaseURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent"
      const fallbackUrl = `${fallbackBaseURL}?key=${apiKey}`
      
      const fallbackResponse = await fetch(fallbackUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
      
      if (!fallbackResponse.ok) {
        const fallbackErrorText = await fallbackResponse.text()
        console.error("Fallback Gemini API error:", fallbackErrorText)
        throw new Error(`Fallback Gemini API error: ${fallbackResponse.status} ${fallbackErrorText}`)
      }
      
      const fallbackData = await fallbackResponse.json()
      
      if (!fallbackData.candidates || fallbackData.candidates.length === 0) {
        throw new Error("No response generated by any model")
      }
      
      // Extract the analysis text from the response
      const analysisText = fallbackData.candidates[0].content.parts[0].text
      
      // Store the analysis in the database if userId is provided
      let imageUrl = null
      let analysisId = null
      
      if (userId && analysisText) {
        try {
          // First, let's try to store the image in storage if it exists
          if (image) {
            // Check if storage bucket exists, create if not
            const { data: buckets } = await supabase.storage.listBuckets()
            const bucketName = 'bone-analysis-images'
            
            if (!buckets?.find(b => b.name === bucketName)) {
              await supabase.storage.createBucket(bucketName, {
                public: false,
                fileSizeLimit: 5242880 // 5MB
              })
            }
            
            // Create a unique file name
            const fileName = `${userId}/${taskId}/${Date.now()}.jpg`
            
            // Upload the image
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from(bucketName)
              .upload(fileName, Buffer.from(base64Data, 'base64'), {
                contentType: 'image/jpeg',
                upsert: true
              })
              
            if (uploadError) {
              console.error("Error uploading image:", uploadError)
            } else if (uploadData) {
              // Get the public URL
              const { data: publicUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName)
                
              imageUrl = publicUrlData?.publicUrl || null
            }
          }
          
          // Now store the analysis data
          const { data: analysisData, error: insertError } = await supabase
            .from('analyses')
            .insert({
              user_id: userId,
              task_id: taskId,
              task_name: taskTitle,
              result_text: analysisText,
              image_url: imageUrl
            })
            .select()
          
          if (insertError) {
            console.error("Error storing analysis:", insertError)
          } else if (analysisData && analysisData.length > 0) {
            analysisId = analysisData[0].id
            console.log("Analysis stored successfully with ID:", analysisId)
          }
        } catch (storageError) {
          console.error("Error in storage process:", storageError)
        }
      }
      
      // Return the analysis result
      return new Response(
        JSON.stringify({ 
          analysis: analysisText,
          analysisId,
          imageUrl,
          modelUsed: "gemini-pro-vision (fallback)"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract the analysis text from the response
    const analysisText = data.candidates[0].content.parts[0].text
    
    // Store the analysis in the database if userId is provided
    let imageUrl = null
    let analysisId = null
    
    if (userId && analysisText) {
      try {
        // First, let's try to store the image in storage if it exists
        if (image) {
          // Check if storage bucket exists, create if not
          const { data: buckets } = await supabase.storage.listBuckets()
          const bucketName = 'bone-analysis-images'
          
          if (!buckets?.find(b => b.name === bucketName)) {
            await supabase.storage.createBucket(bucketName, {
              public: false,
              fileSizeLimit: 5242880 // 5MB
            })
          }
          
          // Create a unique file name
          const fileName = `${userId}/${taskId}/${Date.now()}.jpg`
          
          // Upload the image
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, Buffer.from(base64Data, 'base64'), {
              contentType: 'image/jpeg',
              upsert: true
            })
            
          if (uploadError) {
            console.error("Error uploading image:", uploadError)
          } else if (uploadData) {
            // Get the public URL
            const { data: publicUrlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(fileName)
              
            imageUrl = publicUrlData?.publicUrl || null
          }
        }
        
        // Now store the analysis data
        const { data: analysisData, error: insertError } = await supabase
          .from('analyses')
          .insert({
            user_id: userId,
            task_id: taskId,
            task_name: taskTitle,
            result_text: analysisText,
            image_url: imageUrl
          })
          .select()
        
        if (insertError) {
          console.error("Error storing analysis:", insertError)
        } else if (analysisData && analysisData.length > 0) {
          analysisId = analysisData[0].id
          console.log("Analysis stored successfully with ID:", analysisId)
        }
      } catch (storageError) {
        console.error("Error in storage process:", storageError)
      }
    }

    // Return the analysis result
    return new Response(
      JSON.stringify({ 
        analysis: analysisText,
        analysisId,
        imageUrl,
        modelUsed: "gemini-2.0-flash-thinking-exp-01-21"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Error processing image:", error)
    return new Response(
      JSON.stringify({ error: `Failed to process the image: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
