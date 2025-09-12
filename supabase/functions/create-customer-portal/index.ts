// @ts-ignore: Deno global is available in Supabase Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve: (handler: (req: Request) => Promise<Response>) => void;
};

// @ts-ignore: ESM imports work in Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore: ESM imports work in Deno runtime  
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
    // Get the appropriate Supabase credentials based on environment
    function getSupabaseCredentials(): { url: string; anonKey: string } {
      const vercelEnv = Deno.env.get("VERCEL_ENV");
      const nodeEnv = Deno.env.get("NODE_ENV");

      // Use production keys for production environment
      if (vercelEnv === "production" || nodeEnv === "production") {
        return {
          url:
            Deno.env.get("PROD_SUPABASE_URL") ||
            Deno.env.get("SUPABASE_URL") ||
            "",
          anonKey:
            Deno.env.get("PROD_SUPABASE_ANON_KEY") ||
            Deno.env.get("SUPABASE_ANON_KEY") ||
            "",
        };
      }

      // Use staging keys for all other environments
      return {
        url:
          Deno.env.get("STAGING_SUPABASE_URL") ||
          Deno.env.get("SUPABASE_URL") ||
          "",
        anonKey:
          Deno.env.get("STAGING_SUPABASE_ANON_KEY") ||
          Deno.env.get("SUPABASE_ANON_KEY") ||
          "",
      };
    }

    const { url, anonKey } = getSupabaseCredentials();

    const supabaseClient = createClient(url, anonKey, {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    });

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

    // Get the appropriate Stripe secret key based on environment
    function getStripeSecretKey(): string {
      const vercelEnv = Deno.env.get("VERCEL_ENV");
      const nodeEnv = Deno.env.get("NODE_ENV");

      // Use production keys for production environment
      if (vercelEnv === "production" || nodeEnv === "production") {
        return (
          Deno.env.get("PROD_STRIPE_SECRET_KEY") ||
          Deno.env.get("STRIPE_SECRET_KEY") ||
          ""
        );
      }

      // Use staging keys for all other environments
      return (
        Deno.env.get("STAGING_STRIPE_SECRET_KEY") ||
        Deno.env.get("STRIPE_SECRET_KEY") ||
        ""
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(getStripeSecretKey(), {
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
