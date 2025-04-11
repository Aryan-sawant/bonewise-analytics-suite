import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { decode } from "https://deno.land/std@0.203.0/encoding/base64.ts"; // Deno's built-in base64 decoder

// CORS headers for handling cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow requests from any origin
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', // Allowed headers
}

// Main function to handle incoming requests
serve(async (req) => {
  // Handle CORS preflight requests (OPTIONS method)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders }) // Respond with CORS headers
  }

  try {
    // Parse request body to get image data, task ID, user type, and user ID
    const { image, taskId, userType, userId } = await req.json()

    // Validate required fields
    if (!image) {
      console.error("Validation Error: No image provided.");
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (!taskId) {
       console.error("Validation Error: No task ID provided.");
      return new Response(
        JSON.stringify({ error: 'No task ID provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
     if (!userId) {
       // Allow analysis without saving if needed, but log it.
       console.warn("Warning: No user ID provided. Analysis will proceed but cannot be saved to user history.");
       // Storage/DB parts will be skipped later based on userId check.
     }

    // --- Task Information Lookup ---
    const taskTitles: Record<string, string> = {
      'fracture-detection': 'Bone Fracture Detection',
      'bone-marrow': 'Bone Marrow Cell Classification',
      'osteoarthritis': 'Knee Joint Osteoarthritis Detection',
      'osteoporosis': 'Osteoporosis Stage & BMD Score',
      'bone-age': 'Bone Age Detection',
      'spine-fracture': 'Cervical Spine Fracture Detection',
      'bone-tumor': 'Bone Tumor/Cancer Detection',
      'bone-infection': 'Bone Infection (Osteomyelitis) Detection'
    };
    const taskTitle = taskTitles[taskId] || 'Unknown Analysis Type';

    // --- Detailed Task Prompts (Ensure this object is complete) ---
    const taskPrompts: Record<string, Record<string, string>> = {
       'fracture-detection': {
         common: "Analyze the X-ray, MRI, or CT scan image to assess for fractures. Identify the affected bone and classify the fracture exclusively according to the AO/OTA Fracture and Dislocation Classification system. Provide a simplified explanation of the AO/OTA classification assigned. Determine the severity of the fracture based on the AO/OTA classification and imaging findings. Provide an easy-to-understand explanation of the fracture, including its potential effects on movement and expected recovery timeline, considering the AO/OTA classification. Please also suggest a basic nutrition plan and recovery steps, including remedies, exercises and when can the person drive or work if appropriate, in the context of the AO/OTA classified fracture. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image just don't say anything about that image.",
         doctor: "Analyze the X-ray, MRI, or CT scan image to assess for fractures. Identify the affected bone and classify the fracture exclusively according to the AO/OTA Fracture and Dislocation Classification system. Provide a detailed and comprehensive explanation of the specific AO/OTA classification assigned, including the relevant alphanumeric codes and their precise meaning in terms of fracture morphology, anatomical location, and severity. Based solely on the AO/OTA classification and imaging findings, suggest appropriate medical treatment options, including potential surgical interventions, immobilization techniques, and follow-up care strategies. Also, provide a relevant medications, nutrition plan and recommend specific rehabilitation exercises and remedies as needed and when can the person drive or work, directly informed by the AO/OTA fracture classification and its severity. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image just don't say anything about that image."
       },
       'bone-marrow': {
         common: "Analyze the microscopic biopsy or MRI image of bone marrow cells. Classify the bone marrow cells into relevant categories like Abnormal eosinophil, Artefact, Basophil, Blast, Erythroblast, Eosinophil, Faggott cell, Hairy cell, Smudge cell, Immature lymphocyte, Lymphocyte, Metamyelocyte, Monocyte, Myelocyte, Band neutrophil, Segmented neutrophil, Not identifiable, Other cell, Proerythroblast, Plasma cell, Promyelocyte and identify any concerning or abnormal cells. Explain your findings in simple terms, indicating any unusual cell changes and their potential implications. Provide a nutrition plan and steps to recover, including remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image just don't say anything about that image.",
         doctor: "Analyze the microscopic biopsy or MRI image of bone marrow cells. Classify bone marrow cells into detailed categories like Abnormal eosinophil, Artefact, Basophil, Blast, Erythroblast, Eosinophil, Faggott cell, Hairy cell, Smudge cell, Immature lymphocyte, Lymphocyte, Metamyelocyte, Monocyte, Myelocyte, Band neutrophil, Segmented neutrophil, Not identifiable, Other cell, Proerythroblast, Plasma cell, Promyelocyte, identifying and describing any abnormal cell structures. Provide insights into possible diagnoses and recommend medical interventions, medications, nutrition plans, and recovery steps, including remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image just don't say anything about that image."
       },
       'osteoarthritis': {
         common: "Analyze the knee X-ray or MRI and classify osteoarthritis severity based on Kellgren-Lawrence (K-L) clinical grading like Grade 0: Healthy knee image, Grade 1 (Doubtful): Doubtful joint narrowing with possible osteophytic lipping, Grade 2 (Minimal): Definite presence of osteophytes and possible joint space narrowing, Grade 3 (Moderate): Multiple osteophytes, definite joint space narrowing, with mild sclerosis, Grade 4 (Severe): Large osteophytes, significant joint narrowing, and severe sclerosis. The image will be assessed for signs of knee osteoarthritis, including joint space narrowing and bone changes. You will get an easy-to-understand report on whether osteoarthritis is present and its severity level, along with its impact on knee function, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image just don't say anything about that image.",
         doctor: "Analyze the knee X-ray or MRI and classify osteoarthritis severity based on Kellgren-Lawrence (K-L) clinical grading like Grade 0: Healthy knee image, Grade 1 (Doubtful): Doubtful joint narrowing with possible osteophytic lipping, Grade 2 (Minimal): Definite presence of osteophytes and possible joint space narrowing, Grade 3 (Moderate): Multiple osteophytes, definite joint space narrowing, with mild sclerosis, Grade 4 (Severe): Large osteophytes, significant joint narrowing, and severe sclerosis. Suggest advanced treatments, medications, physiotherapy plans, and surgical options such as knee replacement, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image just don't say anything about that image."
       },
       'osteoporosis': {
         common: "Analyze the bone X-ray and determine osteoporosis stage categorized into normal, osteopenia and osteoporosis with estimated Bone Mineral Density (BMD) score. The scan will be analyzed to determine how strong or weak the bones are and whether osteoporosis is present. You will receive a simple explanation of the results, including whether bone density is lower than normal and what it means for bone health, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image just don't say anything about that image.",
         doctor: "Analyze the bone X-ray and determine osteoporosis stage categorized into normal, osteopenia and osteoporosis with estimated Bone Mineral Density (BMD) score. Recommend specific medications, hormone therapy, and advanced treatments to manage and prevent complications, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image just don't say anything about that image."
       },
       'bone-age': {
         common: "Analyze the X-ray of a child's hand and predict bone age with insights into growth patterns and offering exact age number or range based on Greulich-Pyle (GP) Atlas and	Tanner-Whitehouse (TW) Method. The scan will be assessed to check how well the bones are developing compared to the expected growth pattern for the child's age. You will receive an easy-to-understand result with exact age number or range explaining whether the bone growth is normal, advanced, or delayed, provide nutrition plan, steps to recover like remedies, exercises if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image just don't say anything about that image.",
         doctor: "Analyze the X-ray of a child's hand and predict bone age with insights into growth patterns and offering exact age number or range based on Greulich-Pyle (GP) Atlas and Tanner-Whitehouse (TW) Method. Offer insights into growth abnormalities, hormonal imbalances, and necessary medical interventions if delayed growth is detected, provide medications, nutrition plan, steps to recover like remedies, exercises if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image just don't say anything about that image."
       },
       'spine-fracture': {
         common: "Analyze the X-ray, MRI, or CT scan of the cervical spine for fractures based on the AO/OTA Fracture and Dislocation Classification system. The scan will be analyzed for fractures in the neck bones, and you will receive an explanation of the findings. The report will describe whether a fracture is present, its severity, and how it may affect movement or pain levels, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image just don't say anything about that image.",
         doctor: "Analyze the X-ray, MRI, or CT scan of the cervical spine for fractures based on the AO/OTA Fracture and Dislocation Classification system. Suggest medical treatment plans, possible surgical options, and rehabilitation strategies for full recovery, provide medications, nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image just don't say anything about that image."
       },
       'bone-tumor': {
         common: "Analyze the X-ray, MRI, CT scan, or biopsy image for possible bone tumors or cancerous growths. The image will be checked for any unusual growths or masses in the bone, and you will receive a simple explanation of the findings. If any suspicious areas are detected, the report will describe their size, location, and whether they appear concerning, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image just don't say anything about that image.",
         doctor: "Analyze the X-ray, MRI, CT scan, or biopsy image for possible bone tumors or cancerous growths. Provide detailed insights into tumor classification, possible malignancy assessment, and treatment options, provide medications nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image just don't say anything about that image."
       },
       'bone-infection': {
         common: "Analyze the X-ray, MRI, CT scan, or biopsy image for signs of bone infection (osteomyelitis). The image will be checked for any signs of infection in the bone, such as swelling, bone damage, or abscess formation. You will receive an easy-to-understand explanation of whether an infection is present and how it may be affecting the bone, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image just don't say anything about that image.",
         doctor: "Analyze the X-ray, MRI, CT scan, or biopsy image for signs of bone infection (osteomyelitis). Provide insights on infection severity, possible antibiotic treatments, and surgical recommendations if needed, provide medications nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image just don't say anything about that image."
       }
    };

    // --- Gemini API Configuration ---
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error("Configuration Error: GEMINI_API_KEY not found in environment variables.");
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // Use a capable vision model. Adjust if needed.
    // gemini-2.5-pro-exp-03-25 is more capable.
    const geminiModel = "gemini-2.0-flash";
    const baseURL = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
    const url = `${baseURL}?key=${apiKey}`;

    // --- Supabase Client Initialization ---
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); // Use Service Role Key for backend operations
    if (!supabaseUrl || !supabaseKey) {
         console.error("Configuration Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found.");
         return new Response(
             JSON.stringify({ error: 'Supabase configuration missing' }),
             { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
         );
     }
    // Initialize Supabase client with Service Role Key for backend operations
    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            // Required for service_role key: disable session persistence and auto-refresh
            autoRefreshToken: false,
            persistSession: false
        }
    });

    console.log(`Processing ${taskId} task for user ${userId || 'anonymous'} with AI model ${geminiModel}...`);

    // --- Prepare Image Data for Gemini ---
    let base64Data = image;
    let mimeType = 'image/jpeg'; // Default mime type
    // Attempt to detect mime type from the Base64 data URI prefix (e.g., "data:image/png;base64,...")
    const mimeMatch = image.match(/^data:(image\/[a-z]+);base64,/);
    if (mimeMatch && mimeMatch[1]) {
        mimeType = mimeMatch[1]; // e.g., "image/png"
        base64Data = image.split('base64,')[1]; // Extract only the Base64 part
         if (!base64Data) {
            console.error("Error: Base64 data part is empty after splitting.");
             throw new Error("Invalid Base64 image data format (empty data).");
         }
         console.log(`Detected mime type from image data: ${mimeType}`);
    } else {
         // If prefix doesn't match, assume it's just the Base64 string or an unknown format
         console.warn("Could not detect mime type from Base64 prefix, assuming image/jpeg. Ensure input is valid Base64.");
         // Attempt to remove prefix just in case it was present but malformed
         if (image.includes('base64,')) {
             base64Data = image.split('base64,')[1] || base64Data; // Use original if split results in empty
         }
     }

    // --- Prepare Gemini Request ---
    const userCategory = userType === 'doctor' ? 'doctor' : 'common';
    const promptText = taskPrompts[taskId]?.[userCategory] || `Analyze this medical image for ${taskTitle}.`;
    // Instruction for formatting output using HTML bold tags
    const formattingInstruction = "Format important terms, findings, classifications, and grades using HTML <b> tags for bold (like <b>this text</b>). Do not use markdown asterisks for bolding.";

    // Construct the payload for the Gemini API request
    const payload = {
      contents: [
        {
          parts: [
            { text: promptText + " " + formattingInstruction }, // Combine prompt and formatting instructions
            {
              inline_data: {
                mime_type: mimeType, // Use the detected or default mime type
                data: base64Data     // The extracted Base64 image data
              }
            }
          ]
        }
      ],
      generationConfig: {
        // Optional: Customize generation parameters if needed
        // temperature: 0.1, // Example: Lower temperature for less creative/more factual output
        // maxOutputTokens: 8192, // Check model limits (Flash ~8k, Pro ~1M)
      }
    };

    console.log(`Sending request to Gemini model: ${geminiModel}`);

    // --- Call Gemini API ---
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload) // Send the payload as JSON string
    });

    // --- Handle Gemini API Response ---
    if (!response.ok) {
      // Log detailed error information if the API call fails
      const errorText = await response.text();
      console.error("Gemini API Error Status:", response.status);
      console.error("Gemini API Error Response Text:", errorText);
      try {
        const errorJson = JSON.parse(errorText); // Try parsing error as JSON
        console.error("Gemini API Error JSON:", errorJson);
      } catch (e) { /* Ignore if parsing fails, raw text is already logged */ }
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    // Parse the successful JSON response from Gemini
    const data = await response.json();
    console.log("Received Gemini response."); // Avoid logging full response for PII reasons unless debugging

    // --- Process Gemini Response Content ---
    // Validate the structure of the Gemini response
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
       console.error("Invalid response structure from Gemini:", data); // Log the problematic structure
      throw new Error("No valid response content generated by the model.");
    }

    // Extract the analysis text from the response
    let analysisText = data.candidates[0].content.parts[0].text;

    // Post-processing: Ensure consistent formatting (replace markdown bold/italic with HTML bold)
    analysisText = analysisText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); // Replace **bold**
    analysisText = analysisText.replace(/__(.*?)__/g, '<b>$1</b>');   // Replace __italic__ (treat as bold)
    // Remove stray asterisks or underscores that might remain
    analysisText = analysisText.replace(/(?<!<[^>]*)[*_](?![^<]*>)/g, '');

    console.log("Gemini analysisText length (before DB):", analysisText.length);

    // --- Initialize Variables for Storage/DB Results ---
    let imageUrl: string | null = null;
    let analysisId: string | null = null;

    // --- Store Image and Analysis Data in Supabase (only if userId is valid) ---
    if (userId && analysisText && image) {
      console.log(`Proceeding with storage and DB operations for user ${userId}.`);
      try {
        const bucketName = 'bone-analysis-images';

        // --- Ensure Bucket Exists and is Public ---
        // Note: Using service role bypasses RLS for these admin operations.
        try {
            const { data: buckets, error: listError } = await supabase.storage.listBuckets();
            if (listError) throw listError; // Fail fast if listing buckets errors

            const bucketExists = buckets?.some(b => b.name === bucketName);

            if (!bucketExists) {
                 console.log(`Bucket '${bucketName}' not found, creating as public...`);
                 const { error: createError } = await supabase.storage.createBucket(bucketName, {
                     public: true, // *** CREATE AS PUBLIC BUCKET ***
                     // Consider appropriate file size limits
                     fileSizeLimit: 10 * 1024 * 1024 // Example: 10MB limit
                 });
                 if (createError) throw createError; // Fail fast if bucket creation errors
                  console.log(`Bucket '${bucketName}' created successfully. Verify public read policies if needed.`);
                  // You might need to manually set policies in Supabase UI for public read access
                  // especially if updating an existing private bucket's settings via code isn't supported/intended.
             } else {
                  console.log(`Bucket '${bucketName}' already exists.`);
                  // Optional: Add code here to *check* if the existing bucket is public if needed.
             }
        } catch(bucketSetupError) {
            console.error("Error during bucket setup (listing/creation):", bucketSetupError);
            // Decide whether to continue without storage or halt the process.
            // For now, log the error and continue. Image URL will remain null.
            console.warn("Proceeding without saving image due to bucket setup error.");
        }
        // --- End Bucket Setup ---


        // --- Prepare Image for Upload ---
        // Determine file extension from detected mime type
        const fileExtension = mimeType.split('/')[1] || 'jpg';
        // Create a unique file path/name
        const fileName = `${userId}/${taskId}/${Date.now()}.${fileExtension}`;
        // Decode the Base64 data into a byte array (Uint8Array)
        const imageBuffer = decode(base64Data);

        console.log(`Attempting upload: Bucket=${bucketName}, Path=${fileName}, Mime=${mimeType}, Size=${imageBuffer.length} bytes`);

        // --- Upload Image to Supabase Storage ---
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, imageBuffer, {
            contentType: mimeType, // Set the correct content type
            upsert: false // Set to false to avoid accidental overwrites
          });

        // --- Handle Upload Result & Get Public URL ---
        if (uploadError) {
          console.error("Supabase Storage Upload Error:", uploadError);
          // imageUrl remains null
        } else if (uploadData && uploadData.path) {
          console.log("Upload successful. Path:", uploadData.path);

          // Attempt to get the public URL for the uploaded file
          const { data: publicUrlData, error: urlError } = supabase.storage
            .from(bucketName)
            .getPublicUrl(uploadData.path); // Use the path returned by the upload

           // Check if URL retrieval was successful and the URL is valid
           if (urlError) {
               console.error("Error getting public URL:", urlError);
               imageUrl = null;
           } else if (publicUrlData && publicUrlData.publicUrl) {
               imageUrl = publicUrlData.publicUrl;
               console.log("Retrieved Public URL:", imageUrl);
           } else {
               // This case might happen if the bucket isn't truly public or other issues occur
               console.warn("Public URL data invalid or null:", publicUrlData);
               imageUrl = null;
           }
        } else {
             // Upload might succeed but return unexpected data structure
             console.warn("Upload completed but path data is missing:", uploadData);
             imageUrl = null;
        }

        // --- Insert Analysis Record into Database ---
        // imageUrl will be null if any previous step (upload, get URL) failed
        console.log("Attempting to insert into 'analyses' table with image_url:", imageUrl);
        const { data: analysisData, error: insertError } = await supabase
          .from('analyses')
          .insert({
            user_id: userId,
            task_id: taskId,
            task_name: taskTitle, // Store the readable task name
            result_text: analysisText, // Store the AI's analysis text
            image_url: imageUrl // Store the retrieved public URL (or null)
          })
          .select('id') // Only retrieve the ID of the newly inserted row
          .maybeSingle(); // Use maybeSingle to handle 0 or 1 result gracefully

        if (insertError) {
          console.error("Error inserting analysis into DB:", insertError);
          // analysisId will remain null
        } else if (analysisData && analysisData.id) {
          // Successfully inserted and got the ID
          analysisId = analysisData.id;
          console.log("Analysis stored successfully in DB. Analysis ID:", analysisId);
        } else {
            // Insert might have succeeded but returned no data (unlikely with .select())
            console.warn("No analysis ID returned after DB insert, or insert returned null.");
            analysisId = null;
        }
        // --- End Database Insertion ---

      } catch (storageDbError) {
        // Catch errors specifically from the storage/DB interaction block
        console.error("Error during Storage/DB operations:", storageDbError);
        // Log error but allow function to return analysis text if available
        // imageUrl and analysisId might be null depending on where the error occurred
      }
    } else {
        // Log reason for skipping storage/DB operations
        if (!userId) console.log("Skipping storage/DB: userId is missing.");
        if (!analysisText) console.log("Skipping storage/DB: analysisText is empty.");
        if (!image) console.log("Skipping storage/DB: image data is missing.");
    }


    // --- Return Final Response to Frontend ---
    // Log whether an image URL and analysis ID are being returned
    console.log("Returning final response:", { analysisId: !!analysisId, imageUrl: !!imageUrl });
    return new Response(
      JSON.stringify({
        analysis: analysisText, // The AI analysis text
        analysisId: analysisId, // The ID from the 'analyses' table (or null)
        imageUrl: imageUrl    // The public URL of the stored image (or null)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // Set response headers
    );

  } catch (error) {
    // Catch all other unhandled errors (e.g., JSON parsing, Gemini API, config issues)
    console.error("Unhandled error in Edge Function:", error);
    // Return a generic server error response
    return new Response(
      JSON.stringify({ error: `An unexpected error occurred: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
