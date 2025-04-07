// analyze-bone-image function in Supabase Functions

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"; // Updated Deno Standard Library version
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decode } from "https://deno.land/std@0.224.0/encoding/base64.ts"; // For decoding base64

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- Configuration ---
// Using the specific model name provided by the user
const GEMINI_MODEL_NAME = "gemini-2.5-pro-preview-03-25"; // <<< USER SPECIFIED MODEL
const GEMINI_API_ENDPOINT_VERSION = "v1beta"; // Keep as v1beta, usually correct for preview models
const MAX_OUTPUT_TOKENS = 1048576; // Realistic limit (adjust if this specific model has a different known limit)
const STORAGE_BUCKET_NAME = 'bone-analysis-images';
const SIGNED_URL_EXPIRY = 60 * 60; // Signed URL valid for 1 hour (in seconds)
// --- End Configuration ---


// Helper function to extract details from Data URI
function parseDataUri(dataUri: string): { mimeType: string; base64Data: string; extension: string } | null {
  const match = dataUri.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
  if (!match) {
    console.warn("Input image string is not a valid Data URI format.");
    // Attempt fallback assuming JPEG if it looks like base64 and no comma - less robust
    if (dataUri.length > 100 && !dataUri.includes(',')) {
         console.log("Attempting fallback: Assuming raw base64 JPEG.");
         return { mimeType: 'image/jpeg', base64Data: dataUri, extension: 'jpg' };
    }
    return null;
  }
  const mimeType = match[1];
  const base64Data = match[2];
  // Basic extension mapping
  let extension = mimeType.split('/')[1]?.split('+')[0] || 'bin';
  if (extension === 'jpeg') extension = 'jpg';

  return { mimeType, base64Data, extension };
}


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image: imageDataUri, taskId, userType, userId } = await req.json();

    // --- Input Validation ---
    if (!imageDataUri) {
      return new Response(
        JSON.stringify({ error: 'No image provided (expected Data URI)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: 'No task ID provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- Parse Image Data ---
    const imageDetails = parseDataUri(imageDataUri);
    if (!imageDetails) {
        return new Response(
          JSON.stringify({ error: 'Invalid image format. Expected Data URI (e.g., data:image/jpeg;base64,...)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    const { mimeType, base64Data, extension } = imageDetails;

    // --- Task Definitions ---
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
    };

    const taskTitle = taskTitles[taskId] || 'Unknown Analysis Type';

    // Detailed task prompts - EXACTLY as provided by the user (Keep these as they are)
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
    }; // <<< Kept your full prompts here

    // --- Initialize APIs ---
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable not set.');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase environment variables (URL or Service Role Key) not set.');
        return new Response(
            JSON.stringify({ error: 'Supabase configuration missing' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    // Use auth options for service role key in Edge Functions
    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });

    // --- Prepare Gemini Request ---
    console.log(`Processing ${taskId} task with AI model ${GEMINI_MODEL_NAME}...`);

    // Construct the API URL using the specified model name
    const baseURL = `https://generativelanguage.googleapis.com/${GEMINI_API_ENDPOINT_VERSION}/models/${GEMINI_MODEL_NAME}:generateContent`;
    const url = `${baseURL}?key=${apiKey}`;

    const userCategory = userType === 'doctor' ? 'doctor' : 'common';
    const promptForTask = taskPrompts[taskId];
    if (!promptForTask) {
        console.error(`No prompts defined for taskId: ${taskId}`);
        return new Response(
            JSON.stringify({ error: `Invalid task ID: ${taskId}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    const promptText = promptForTask[userCategory] || promptForTask['common'] || `Analyze this medical image for ${taskTitle}.`; // Add fallback

    const formattingInstruction = "Make sure to format important information using HTML <b> tags for bold (not markdown asterisks). Do not use markdown.";

    const payload = {
      contents: [
        {
          parts: [
            { text: promptText + " " + formattingInstruction },
            {
              inline_data: {
                mime_type: mimeType, // Use detected MIME type
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.0,
        maxOutputTokens: MAX_OUTPUT_TOKENS, // Use configured realistic limit
      }
    };

    // --- Call Gemini API ---
    console.log(`Sending request to Gemini model: ${GEMINI_MODEL_NAME}`);
    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(`Gemini API error (${geminiResponse.status}) using model ${GEMINI_MODEL_NAME}: ${errorText}`);
      console.error("Gemini API full response status:", geminiResponse.status, geminiResponse.statusText);
       try {
           const errorJson = JSON.parse(errorText); // Attempt to parse if JSON error
           console.error("Gemini API error JSON:", errorJson);
       } catch (e) { /* Ignore if error text wasn't JSON */ }

      let errorMessage = `Gemini API error: ${geminiResponse.status}`;
      try {
           const errorJson = JSON.parse(errorText);
           errorMessage = errorJson?.error?.message || errorMessage;
      } catch (e) {}

      // If the error is 404 Not Found, it might specifically be the model name
      if (geminiResponse.status === 404) {
          errorMessage = `Gemini API error: Model ${GEMINI_MODEL_NAME} not found or incorrect API endpoint. Please verify the model name and access permissions.`;
      }

      return new Response(
        JSON.stringify({ error: `AI analysis failed: ${errorMessage}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // 502 Bad Gateway
      );
    }

    // --- Process Gemini Response ---
    const data = await geminiResponse.json();

    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
        console.error(`Gemini API (${GEMINI_MODEL_NAME}) returned no candidates. Response:`, JSON.stringify(data));
        throw new Error("No response generated by the model (no candidates)");
    }
    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
        const finishReason = candidate.finishReason;
        console.error(`Gemini API (${GEMINI_MODEL_NAME}) returned no content parts. Finish Reason: ${finishReason}. Response:`, JSON.stringify(data));
        if (finishReason === 'SAFETY') { throw new Error("Analysis blocked due to safety settings."); }
        else if (finishReason) { throw new Error(`Analysis stopped unexpectedly. Reason: ${finishReason}`); }
        else { throw new Error("No response generated by the model (empty content)"); }
    }
    if (!candidate.content.parts[0].text) {
         console.error(`Gemini API (${GEMINI_MODEL_NAME}) response part has no text. Response:`, JSON.stringify(data));
         throw new Error("No text found in the model response part.");
    }

    let analysisText = candidate.content.parts[0].text;

    // Post-processing for formatting (fallback/cleanup)
    analysisText = analysisText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    analysisText = analysisText.replace(/\*(.*?)\*/g, '$1'); // Remove single asterisks
    analysisText = analysisText.trim();

    console.log("Gemini analysisText length:", analysisText.length);

    // --- Store Results in Supabase ---
    let storedImageUrl: string | null = null;
    let analysisId: number | null = null;
    let dbImagePath: string | null = null; // Path in storage for DB record

    if (userId && analysisText) {
      try {
        // 1. Store Image in Supabase Storage
        const bucketName = STORAGE_BUCKET_NAME;
        const fileName = `${userId}/${taskId}/${Date.now()}.${extension}`;
        const imageBuffer = decode(base64Data);

        console.log(`Uploading image to Supabase Storage: ${bucketName}/${fileName}`);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, imageBuffer, {
            contentType: mimeType,
            upsert: false
          });

        if (uploadError) {
          console.error("Error uploading image to Supabase Storage:", uploadError);
        } else if (uploadData) {
          console.log("Image uploaded successfully:", uploadData.path);
          dbImagePath = uploadData.path; // Store the path

          // 2. Generate Signed URL for client access
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(fileName, SIGNED_URL_EXPIRY);

          if (signedUrlError) {
            console.error("Error creating signed URL:", signedUrlError);
          } else {
            storedImageUrl = signedUrlData.signedUrl;
            console.log("Generated signed URL successfully.");
          }
        }

        // 3. Insert Analysis Data into Supabase DB
        console.log("Storing analysis in database...");
        const { data: analysisData, error: insertError } = await supabase
          .from('analyses')
          .insert({
            user_id: userId,
            task_id: taskId,
            task_name: taskTitle,
            result_text: analysisText,
            image_path: dbImagePath, // Store the storage path
            model_used: GEMINI_MODEL_NAME // Store the model used
          })
          .select('id')
          .single();

        if (insertError) {
          console.error("Error storing analysis in database:", insertError);
          if (dbImagePath) { // Attempt cleanup on DB error
              console.warn(`Attempting to remove orphaned image due to DB error: ${dbImagePath}`);
              await supabase.storage.from(bucketName).remove([dbImagePath]).catch(e => console.error("Image cleanup failed:", e));
          }
          throw insertError; // Propagate DB error
        } else if (analysisData) {
          analysisId = analysisData.id;
          console.log("Analysis stored successfully with ID:", analysisId);
        } else {
           console.warn("Analysis data insertion returned no data or ID.");
        }

      } catch (storageDbError) {
        console.error("Error during storage/database operations:", storageDbError);
        // Don't necessarily halt everything, but log it. The analysis text might still be useful.
      }
    } else {
        console.log("Skipping storage: No userId provided or analysis text is empty.");
    }

    // --- Return Analysis Result ---
    // Return analysis even if storage failed, but include nulls for IDs/URLs
    return new Response(
      JSON.stringify({
        analysis: analysisText,
        analysisId: analysisId, // Send the DB id back (null if storage failed/skipped)
        imageUrl: storedImageUrl // Send the temporary signed URL (null if storage failed/skipped)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Unhandled error processing image analysis request:", error);
    return new Response(
      JSON.stringify({ error: `Failed to process the image: ${error.message || 'Unknown error'}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
