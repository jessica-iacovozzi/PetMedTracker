/**
 * Environment Variable Management
 * Handles staging vs production environment configuration
 */

export type Environment = "development" | "staging" | "production";

export interface Config {
  environment: Environment;
  supabase: {
    url: string;
    anonKey: string;
    serviceKey: string;
    projectId: string;
  };
  stripe: {
    secretKey: string;
    webhookSecret: string;
  };
  app: {
    url: string;
    name: string;
  };
}

/**
 * Determines the current environment
 */
function getEnvironment(): Environment {
  // Check if we're in Vercel production
  if (process.env.VERCEL_ENV === "production") {
    return "production";
  }

  // Check if we're in Vercel preview (staging)
  if (process.env.VERCEL_ENV === "preview") {
    return "staging";
  }

  // Check NODE_ENV for production
  if (process.env.NODE_ENV === "production") {
    return "production";
  }

  // Check for custom staging environment variable
  if (process.env.APP_ENV === "staging") {
    return "staging";
  }

  // Default to development for local development
  return "development";
}

/**
 * Gets environment-specific variable with fallback
 */
function getEnvVar(
  key: string,
  environment: Environment,
  fallback?: string,
): string {
  let value: string | undefined;

  // Try environment-specific variable first
  if (environment === "production") {
    value = process.env[`PROD_${key}`];
  } else {
    // For staging and development, try staging first
    value = process.env[`STAGING_${key}`];
  }

  // Fallback to generic variable for development or if prefixed not found
  if (!value) {
    value = process.env[key];
  }

  // Use fallback if provided
  if (!value && fallback !== undefined) {
    value = fallback;
  }

  // For development, don't throw error for missing variables, use empty string
  if (!value) {
    if (environment === "development") {
      console.warn(
        `Missing environment variable: ${key} (environment: ${environment})`,
      );
      return fallback || "";
    }
    throw new Error(
      `Missing required environment variable: ${key} (environment: ${environment})`,
    );
  }

  return value;
}

/**
 * Gets public environment variable (NEXT_PUBLIC_*)
 */
function getPublicEnvVar(
  key: string,
  environment: Environment,
  fallback?: string,
): string {
  let value: string | undefined;

  // Try environment-specific public variable first
  if (environment === "production") {
    value = process.env[`PROD_${key}`];
  } else {
    // For staging and development, try staging first
    value = process.env[`STAGING_${key}`];
  }

  // Fallback to generic public variable
  if (!value) {
    value = process.env[key];
  }

  // Use fallback if provided
  if (!value && fallback !== undefined) {
    value = fallback;
  }

  // For development, provide default fallback
  if (!value) {
    if (environment === "development") {
      console.warn(
        `Missing public environment variable: ${key} (environment: ${environment})`,
      );
      return fallback || "http://localhost:3000";
    }
    throw new Error(
      `Missing required public environment variable: ${key} (environment: ${environment})`,
    );
  }

  return value;
}

/**
 * Validates that all required environment variables are present
 */
function validateConfig(config: Config): void {
  // Skip validation in development to allow the app to start
  if (config.environment === "development") {
    return;
  }

  const requiredFields = [
    "supabase.url",
    "supabase.anonKey",
    "supabase.serviceKey",
    "stripe.secretKey",
    "stripe.webhookSecret",
  ];

  const missingFields: string[] = [];

  requiredFields.forEach((field) => {
    const keys = field.split(".");
    let value: unknown = config;

    for (const key of keys) {
      value = value?.[key];
    }

    if (!value || (typeof value === 'string' && value.trim() === "")) {
      missingFields.push(field);
    }
  });

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required configuration fields: ${missingFields.join(", ")} (environment: ${config.environment})`,
    );
  }
}

/**
 * Creates configuration object for the current environment
 */
function createConfig(): Config {
  const environment = getEnvironment();

  const config: Config = {
    environment,
    supabase: {
      url: getEnvVar("SUPABASE_URL", environment),
      anonKey: getEnvVar("SUPABASE_ANON_KEY", environment),
      serviceKey: getEnvVar("SUPABASE_SERVICE_KEY", environment),
      projectId: getEnvVar("SUPABASE_PROJECT_ID", environment, ""),
    },
    stripe: {
      secretKey: getEnvVar("STRIPE_SECRET_KEY", environment),
      webhookSecret: getEnvVar("STRIPE_WEBHOOK_SECRET", environment),
    },
    app: {
      url: getPublicEnvVar(
        "NEXT_PUBLIC_APP_URL",
        environment,
        "http://localhost:3000",
      ),
      name: "PetMeds Reminder",
    },
  };

  // Validate configuration
  validateConfig(config);

  return config;
}

// Export singleton config instance
export const config = createConfig();

// Export utility functions for testing
export const configUtils = {
  getEnvironment,
  getEnvVar,
  getPublicEnvVar,
  validateConfig,
  createConfig,
};

// Type guards
export function isProduction(): boolean {
  return config.environment === "production";
}

export function isStaging(): boolean {
  return config.environment === "staging";
}

export function isDevelopment(): boolean {
  return config.environment === "development";
}

// Environment-specific logging
export function logConfig(): void {
  if (isDevelopment()) {
    console.log("🔧 Configuration loaded:", {
      environment: config.environment,
      supabaseUrl: config.supabase.url,
      appUrl: config.app.url,
      // Don't log sensitive keys
    });
  }
}
