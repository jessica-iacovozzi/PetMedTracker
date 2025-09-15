// @ts-ignore: Deno global is available in Supabase Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore: ESM imports work in Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: ESM imports work in Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Get the appropriate Supabase credentials based on environment
function getSupabaseCredentials(): { url: string; serviceKey: string } {
  const vercelEnv = Deno.env.get("VERCEL_ENV");
  const nodeEnv = Deno.env.get("NODE_ENV");

  // Use production credentials for production environment
  if (vercelEnv === "production" || nodeEnv === "production") {
    return {
      url:
        Deno.env.get("PROD_SUPABASE_URL") || Deno.env.get("SUPABASE_URL") || "",
      serviceKey:
        Deno.env.get("PROD_SUPABASE_SERVICE_ROLE_KEY") ||
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
        "",
    };
  }

  // Use staging credentials for all other environments
  return {
    url:
      Deno.env.get("STAGING_SUPABASE_URL") ||
      Deno.env.get("SUPABASE_URL") ||
      "",
    serviceKey:
      Deno.env.get("STAGING_SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      "",
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url, serviceKey } = getSupabaseCredentials();
    const supabase = createClient(url, serviceKey);

    // Get current time
    const now = new Date();
    const currentTime = now.toISOString();

    // Find pending reminders that are due (within the last 5 minutes)
    const fiveMinutesAgo = new Date(
      now.getTime() - 5 * 60 * 1000,
    ).toISOString();

    const { data: pendingReminders, error: fetchError } = await supabase
      .from("reminders")
      .select(
        `
        *,
        pets!inner(name, species),
        medications!inner(name, dosage),
        users!inner(email, name)
      `,
      )
      .eq("status", "pending")
      .gte("scheduled_time", fiveMinutesAgo)
      .lte("scheduled_time", currentTime);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${pendingReminders?.length || 0} pending reminders`);

    if (!pendingReminders || pendingReminders.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending reminders found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    const results: Array<{
      reminderId: string;
      petName?: string;
      medicationName?: string;
      emailSent?: boolean;
      pushSent?: boolean;
      error?: string;
    }> = [];

    for (const reminder of pendingReminders) {
      try {
        // Get user's notification preferences
        const { data: preferences } = await supabase
          .from("notification_preferences")
          .select("email_enabled, push_enabled")
          .eq("user_id", reminder.user_id)
          .single();

        const emailEnabled = preferences?.email_enabled ?? true;
        const pushEnabled = preferences?.push_enabled ?? true;

        let emailSent = false;
        let pushSent = false;

        // Send email notification if enabled
        if (emailEnabled && reminder.users?.email) {
          try {
            // Here you would integrate with your email service (SendGrid, etc.)
            // For now, we'll just log and mark as sent
            console.log(
              `Sending email reminder to ${reminder.users.email} for ${reminder.pets.name}'s ${reminder.medications.name}`,
            );

            // Log the email attempt
            await supabase.from("reminder_logs").insert({
              reminder_id: reminder.id,
              sent_at: new Date().toISOString(),
              channel: "email",
              status: "success",
            });

            emailSent = true;
          } catch (emailError) {
            console.error("Email sending failed:", emailError);
            await supabase.from("reminder_logs").insert({
              reminder_id: reminder.id,
              sent_at: new Date().toISOString(),
              channel: "email",
              status: "failed",
            });
          }
        }

        // Send push notification if enabled
        if (pushEnabled) {
          try {
            // Here you would integrate with your push notification service
            // For now, we'll just log and mark as sent
            console.log(
              `Sending push notification for ${reminder.pets.name}'s ${reminder.medications.name}`,
            );

            // Log the push attempt
            await supabase.from("reminder_logs").insert({
              reminder_id: reminder.id,
              sent_at: new Date().toISOString(),
              channel: "push",
              status: "success",
            });

            pushSent = true;
          } catch (pushError) {
            console.error("Push notification failed:", pushError);
            await supabase.from("reminder_logs").insert({
              reminder_id: reminder.id,
              sent_at: new Date().toISOString(),
              channel: "push",
              status: "failed",
            });
          }
        }

        // Update reminder status to 'sent'
        if (emailSent || pushSent) {
          await supabase
            .from("reminders")
            .update({ status: "sent" })
            .eq("id", reminder.id);
        }

        results.push({
          reminderId: reminder.id,
          petName: reminder.pets.name,
          medicationName: reminder.medications.name,
          emailSent,
          pushSent,
        });
      } catch (reminderError) {
        console.error(
          `Error processing reminder ${reminder.id}:`,
          reminderError,
        );
        results.push({
          reminderId: reminder.id,
          error: reminderError.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Reminder notifications processed",
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in send-reminder-notifications:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
