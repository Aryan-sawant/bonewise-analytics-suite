
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShareRequestBody {
  to: string;
  subject: string;
  message: string;
  pdfBase64: string;
  analysisType: string;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    console.log("Share results function invoked");
    
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse the request body
    const { to, subject, message, pdfBase64, analysisType, timestamp }: ShareRequestBody = await req.json();

    // Validate the email address
    if (!to || !to.includes("@")) {
      console.error("Invalid email address:", to);
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Generate a unique filename
    const date = new Date().toISOString().split("T")[0];
    const fileName = `${analysisType.replace(/\s+/g, "_").toLowerCase()}_report_${date}.pdf`;

    // Simple HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #4f46e5; padding: 15px; color: white; border-radius: 5px;">
          <h2>${analysisType} Results</h2>
        </div>
        <div style="padding: 15px; border: 1px solid #e5e7eb; border-radius: 5px; margin-top: 10px;">
          <p>Analysis completed on ${timestamp}</p>
          <p>${message}</p>
          <p>The analysis results are attached as a PDF.</p>
        </div>
        <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 20px;">
          This is an automated message from Bone Health Analysis AI.<br>
          For informational purposes only, not a substitute for professional medical advice.
        </p>
      </body>
      </html>
    `;

    console.log("Sending email to:", to);
    console.log("PDF attachment size:", pdfBase64.length);

    // Send the email
    const { data, error } = await supabaseClient.functions.invoke("send-email", {
      body: {
        to,
        subject,
        html: htmlContent,
        attachments: [
          {
            content: pdfBase64,
            filename: fileName,
            type: "application/pdf",
            disposition: "attachment",
          },
        ],
      },
    });

    if (error) {
      console.error("Error invoking send-email:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, message: "Analysis results shared successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sharing results:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to share analysis results", 
        details: error instanceof Error ? error.message : String(error) 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
