
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const { to, subject, html, text, attachments } = await req.json();
    
    if (!to || !to.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid recipient email" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    const emailOptions = {
      from: "Bone Health Analysis <no-reply@bonehealth.ai>",
      to: [to],
      subject: subject || "Bone Health Analysis Results",
      html: html,
      text: text,
      attachments: attachments || []
    };
    
    const { data, error } = await resend.emails.send(emailOptions);
    
    if (error) {
      throw error;
    }
    
    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to send email", 
        details: error instanceof Error ? error.message : String(error) 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
