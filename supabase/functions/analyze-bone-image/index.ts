
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
    console.log(`Processing ${taskId} task with Gemini AI...`)

    // Use the correct Gemini model (gemini-1.5-flash-latest)
    const baseURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"
    const url = `${baseURL}?key=${apiKey}`

    // Extract the base64 data from the data URI
    let base64Data = image
    if (image.includes('base64,')) {
      base64Data = image.split('base64,')[1]
    }

    // Create prompt based on task type with specific instructions for different user types
    let promptText = `Analyze this medical image for ${taskTitle}.\n\n`

    if (userType === 'doctor') {
      promptText += `Provide a detailed professional medical analysis with specific technical terms and measurements appropriate for a healthcare professional. Include likely diagnoses, relevant measurements, and potential clinical implications.`
    } else {
      promptText += `Provide a clear, informative analysis in simple terms suitable for a patient. Avoid overly technical language, but ensure the information is accurate and helpful. Include educational content about the condition, if relevant.`
    }

    // Add task-specific instructions
    switch (taskId) {
      case 'fracture-detection':
        promptText += `\n\nSpecifically, identify any visible fractures, their location, type (e.g., simple, comminuted, spiral), and severity.`
        break
      case 'bone-marrow':
        promptText += `\n\nIdentify and classify visible cell types, assess cell morphology, and note any abnormalities in the bone marrow sample.`
        break
      case 'osteoarthritis':
        promptText += `\n\nAssess joint space narrowing, presence of osteophytes, subchondral sclerosis, and other signs of knee osteoarthritis. If possible, estimate severity (mild, moderate, severe).`
        break
      case 'osteoporosis':
        promptText += `\n\nEvaluate bone mineral density, identify any compression fractures, and assess overall bone quality. If visible, note T-score ranges.`
        break
      case 'bone-age':
        promptText += `\n\nAnalyze skeletal maturity markers to determine approximate bone age. Compare with chronological age if that information is available.`
        break
      case 'spine-fracture':
        promptText += `\n\nIdentify any fractures in the cervical spine, note their location, stability concerns, and if there are any signs of spinal cord involvement.`
        break
      case 'bone-tumor':
        promptText += `\n\nDescribe any visible bone lesions, their characteristics (lytic, blastic, mixed), borders (well-defined vs. infiltrative), and possible differential diagnoses.`
        break
      case 'bone-infection':
        promptText += `\n\nEvaluate for signs of osteomyelitis including periosteal reaction, bone destruction, soft tissue involvement, and sequestrum/involucrum if present.`
        break
    }

    promptText += `\n\nFormat your response with clear sections including Summary, Findings, Interpretation, and Recommendations. Use proper headings and make the report look professional.`

    // Prepare the request to Gemini
    const payload = {
      contents: [
        {
          parts: [
            { text: promptText },
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

    console.log("Sending request to Gemini with model: gemini-1.5-flash-latest");
    
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
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response generated by the model")
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
        imageUrl
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
