import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    const supabase = await createClient();
    const { data, error } = await supabase.from("users").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: "unhealthy",
          error: "Database connection failed",
          details: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      );
    }

    // Check environment variables
    const requiredEnvVars = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_KEY",
      "STRIPE_SECRET_KEY",
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar],
    );

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        {
          status: "unhealthy",
          error: "Missing environment variables",
          missing: missingEnvVars,
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      status: "healthy",
      version: process.env.npm_package_version || "unknown",
      environment: process.env.NODE_ENV || "unknown",
      database: "connected",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
