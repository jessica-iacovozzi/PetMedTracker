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

    // Check environment variables using config
    const { config } = await import("@/lib/config");

    const configFields = [
      config.supabase.url,
      config.supabase.anonKey,
      config.supabase.serviceKey,
      config.stripe.secretKey,
    ];

    const missingFields = configFields.filter(
      (field) => !field || field.trim() === "",
    );
    const missingEnvVars: string[] = [];

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          status: "unhealthy",
          error: "Missing configuration fields",
          environment: config.environment,
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      status: "healthy",
      version: process.env.npm_package_version || "unknown",
      environment: config.environment,
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
