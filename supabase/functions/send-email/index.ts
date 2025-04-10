
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
    console.log("Send email function invoked");
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set");
      throw new Error("Email service configuration missing");
    }
    
    const resend = new Resend(resendApiKey);
    
    const { to, subject, html, text, attachments } = await req.json();
    
    if (!to || !to.includes("@")) {
      console.error("Invalid recipient email:", to);
      return new Response(
        JSON.stringify({ error: "Invalid recipient email" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    console.log("Preparing to send email to:", to);
    console.log("Email subject:", subject);
    console.log("Attachments:", attachments ? "Yes (count: " + attachments.length + ")" : "No");
    
    // Prepare email options
    const emailOptions = {
      from: "Bone Health Analysis <no-reply@bonehealth.ai>",
      to: [to],
      subject: subject || "Bone Health Analysis Results",
      html: html,
      text: text,
      attachments: attachments || []
    };
    
    console.log("Sending email via Resend API");
    const { data, error } = await resend.emails.send(emailOptions);
    
    if (error) {
      console.error("Resend API error:", error);
      throw error;
    }
    
    console.log("Email sent successfully:", data);
    
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
