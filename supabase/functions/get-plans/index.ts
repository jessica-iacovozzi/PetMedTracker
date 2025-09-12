import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";

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

const stripe = new Stripe(getStripeSecretKey(), {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const plans = await stripe.plans.list({
      active: true,
    });

    return new Response(JSON.stringify(plans.data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error getting products:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
