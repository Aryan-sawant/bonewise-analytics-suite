
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
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse the request body
    const { to, subject, message, pdfBase64, analysisType, timestamp }: ShareRequestBody = await req.json();

    // Validate the email address
    if (!to || !to.includes("@")) {
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

    // HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(to right, #3b82f6, #4f46e5); padding: 20px; border-radius: 8px 8px 0 0; color: white; }
          .content { padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
          .button { display: inline-block; background: linear-gradient(to right, #3b82f6, #4f46e5); color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Bone Health Analysis Results</h2>
        </div>
        <div class="content">
          <p>Analysis results for <strong>${analysisType}</strong> completed on ${timestamp} have been shared with you.</p>
          
          <p>${message}</p>
          
          <p>The analysis results are attached to this email as a PDF document.</p>
          
          <p><strong>Note:</strong> This AI-powered analysis is for informational purposes only and is not a substitute for professional medical advice.</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} Bone Health Analysis AI</p>
        </div>
      </body>
      </html>
    `;

    // Send the email
    const { error } = await supabaseClient.functions.invoke("send-email", {
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
      throw error;
    }

    // Store record of shared analysis in the database (optional)
    const { error: dbError } = await supabaseClient
      .from("shared_analyses")
      .insert({
        recipient_email: to,
        analysis_type: analysisType,
        shared_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error("Error logging share action:", dbError);
      // Continue anyway, this is not critical
    }

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
