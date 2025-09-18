import { NextRequest, NextResponse } from "next/server";
import { config, isProduction, isStaging, isDevelopment } from "@/lib/config";

export async function GET(request: NextRequest) {
  try {
    // Basic environment info (safe to expose)
    const environmentInfo = {
      environment: config.environment,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "unknown",
      isProduction: isProduction(),
      isStaging: isStaging(),
      isDevelopment: isDevelopment(),
    };

    // Add debug info in non-production environments
    if (!isProduction()) {
      return NextResponse.json({
        ...environmentInfo,
        config: {
          supabaseUrl: config.supabase.url,
          appUrl: config.app.url,
          // Never expose sensitive keys
        },
      });
    }

    return NextResponse.json(environmentInfo);
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Configuration error",
        message:
          error instanceof Error
            ? error.message
            : "Unknown configuration error",
        environment: process.env.NODE_ENV || "unknown",
      },
      { status: 500 },
    );
  }
}
