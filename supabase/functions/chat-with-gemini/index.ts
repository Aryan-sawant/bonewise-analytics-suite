
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
    const { message, context, userType, userId, analysisId } = await req.json()

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'No message provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Gemini API
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the Supabase client if we need to store the interaction
    const supabase = userId && analysisId ? createClient(
      Deno.env.get('SUPABASE_URL') as string,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    ) : null;

    // Call Gemini API
    console.log(`Processing chat request with AI...`)

    // Model configuration - using gemini-2.0-flash model
    const modelName = 'gemini-2.0-flash'; // Updated to use the gemini-2.0-flash model
    const baseURL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
    const url = `${baseURL}?key=${apiKey}`;

    // Prepare enhanced context with user type and formatting instructions
    const enhancedContext = context ?
      `${context}\n\nAdditional context: The user asking the question is a ${userType === 'doctor' ? 'healthcare professional (write in technical medical terms)' : 'patient (explain in simple terms that a non-medical person can understand)'}.\n\nMake sure to format important information using HTML bold (<b>text</b>) for emphasis. Do not use markdown formatting.\n\nUser: ${message}`
      : `The user asking the question is a ${userType === 'doctor' ? 'healthcare professional (write in technical medical terms)' : 'patient (explain in simple terms that a non-medical person can understand)'}.\n\nMake sure to format important information using HTML bold (<b>text</b>) for emphasis. Do not use markdown formatting.\n\nUser: ${message}`; // Ensure instructions are included even without prior context

    // Prepare the request to Gemini
    const payload = {
      contents: [
        {
          parts: [
            {
              text: enhancedContext
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048, // Reduced from maximum to optimize the request
      },
      // Adding safety settings to ensure appropriate responses
      safetySettings: [
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    }

    // Log the model being used correctly
    console.log(`Sending request to Gemini with model: ${modelName}`);

    // Implement retries for rate limiting
    let retries = 3;
    let response = null;
    let error = null;

    while (retries > 0) {
      try {
        // Call the Gemini API
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          break; // Successfully got a response
        }
        
        if (response.status === 429) {
          // Rate limit hit - get retry delay from response if available
          const errorText = await response.text();
          let retryDelay = 5000; // Default to 5 seconds
          
          try {
            const errorJson = JSON.parse(errorText);
            // Check if there's a retry delay suggestion in the response
            const retryInfo = errorJson?.error?.details?.find(d => d['@type']?.includes('RetryInfo'));
            if (retryInfo && retryInfo.retryDelay) {
              const delayString = retryInfo.retryDelay;
              // Convert "30s" to milliseconds
              retryDelay = parseInt(delayString.replace(/[^0-9]/g, '')) * 1000;
              console.log(`Rate limit hit. Retrying in ${retryDelay/1000} seconds...`);
            }
          } catch (parseError) {
            console.error("Error parsing rate limit response:", parseError);
          }
          
          retries--;
          if (retries > 0) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
        }
        
        // For non-429 errors or if we've exhausted retries
        const errorText = await response.text();
        console.error("Gemini API error:", response.status, errorText);
        error = new Error(`Gemini API error: ${response.status} ${errorText}`);
        break;
      } catch (fetchError) {
        console.error("Network error calling Gemini API:", fetchError);
        error = fetchError;
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s between retries
          continue;
        }
        break;
      }
    }

    // If we still have an error after retries
    if (!response || !response.ok) {
      throw error || new Error("Failed to get valid response from Gemini API after retries");
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0 || !data.candidates[0].content.parts[0].text) {
       console.error("Invalid response structure from Gemini:", JSON.stringify(data, null, 2));
       throw new Error("No valid response content generated by the model");
    }

    // Extract the raw response text
    let aiResponse = data.candidates[0].content.parts[0].text

    // --- START: Apply Post-processing Formatting ---
    console.log("Applying formatting to AI response...");
    // Replace markdown bold/italic with HTML bold
    aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); // Replace **bold**
    aiResponse = aiResponse.replace(/__(.*?)__/g, '<b>$1</b>');   // Replace __italic__ (treat as bold)
    // Remove stray asterisks or underscores that might remain outside tags
    aiResponse = aiResponse.replace(/(?<!<[^>]*)[*_](?![^<]*>)/g, '');
    console.log("Formatting applied.");
    // --- END: Apply Post-processing Formatting ---

    // Store the chat interaction (using the formatted response) if we have user ID and analysis ID
    if (userId && analysisId && supabase) {
      try {
        const { data: chatData, error: insertError } = await supabase
          .from('chat_interactions')
          .insert({
            user_id: userId,
            analysis_id: analysisId,
            user_message: message, // Store the original user message
            ai_response: aiResponse // Store the formatted AI response
          })

        if (insertError) {
          console.error("Error storing chat interaction:", insertError)
          // Decide if this should be a fatal error or just logged
        } else {
          console.log("Chat interaction stored successfully")
        }
      } catch (storageError) {
        console.error("Error during chat storage process:", storageError)
        // Decide if this should be a fatal error or just logged
      }
    }

    // Return the formatted AI response
    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Error processing chat request:", error)
    return new Response(
      JSON.stringify({ error: `Failed to process the chat: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

console.log("Chat function started, listening for requests..."); // Add a startup log
