import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17.6.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // Get the user from the request
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("User not found");
    }

    const { user_id, return_url } = await req.json();

    if (!user_id) {
      throw new Error("User ID is required");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get user's Stripe customer ID from database
    const { data: userData, error: userError } = await supabaseClient
      .from("users")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (userError || !userData) {
      throw new Error("User not found in database");
    }

    let customerId = userData.stripe_customer_id;

    // If no customer ID exists, get it from subscriptions table
    if (!customerId) {
      const { data: subscription } = await supabaseClient
        .from("subscriptions")
        .select("customer_id")
        .eq("user_id", user_id)
        .single();

      if (subscription?.customer_id) {
        customerId = subscription.customer_id;

        // Update user record with customer ID
        await supabaseClient
          .from("users")
          .update({ stripe_customer_id: customerId })
          .eq("user_id", user_id);
      }
    }

    if (!customerId) {
      throw new Error("No Stripe customer found for this user");
    }

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: return_url || `${new URL(req.url).origin}/dashboard/settings`,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
