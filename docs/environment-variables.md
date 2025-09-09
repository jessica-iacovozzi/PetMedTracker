# Environment Variable Management

This document explains how environment variables are managed across different environments (development, staging, production) in the Pet Medication Reminder App.

## Overview

The application uses a centralized configuration system that automatically detects the current environment and loads the appropriate variables. This ensures that:

- Local development uses development variables
- Vercel Preview deployments use staging variables  
- Vercel Production deployments use production variables
- All environments are isolated and secure

## Environment Detection

The system detects the environment using the following priority:

1. **VERCEL_ENV** (Vercel-specific)
   - `production` → Production environment
   - `preview` → Staging environment

2. **NODE_ENV** (Standard)
   - `production` → Production environment
   - `staging` → Staging environment

3. **Default** → Development environment

## Variable Naming Convention

Environment-specific variables use prefixes:

- **Production**: `PROD_` or `PRODUCTION_`
- **Staging**: `STAGING_` or `STAGE_`
- **Development**: No prefix (fallback)

### Example:
```bash
# Development (no prefix)
SUPABASE_URL=https://dev.supabase.co

# Staging
STAGING_SUPABASE_URL=https://staging.supabase.co

# Production  
PROD_SUPABASE_URL=https://prod.supabase.co
```

## Required Variables

### Supabase Configuration
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_KEY` - Service role key (server-side only)
- `SUPABASE_PROJECT_ID` - Project identifier

### Stripe Configuration
- `STRIPE_SECRET_KEY` - Stripe secret key (sk_test_ for staging, sk_live_ for production)
- `STRIPE_WEBHOOK_SECRET` - Webhook endpoint secret

### App Configuration
- `NEXT_PUBLIC_APP_URL` - Application base URL

## Setup Instructions

### 1. Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your development values:
   ```bash
   # Development values (no prefix)
   SUPABASE_URL=your_dev_supabase_url
   SUPABASE_ANON_KEY=your_dev_anon_key
   STRIPE_SECRET_KEY=sk_test_your_dev_key
   ```

### 2. Staging Environment (Vercel)

Set environment variables in Vercel dashboard with `STAGING_` prefix:

```bash
STAGING_SUPABASE_URL=your_staging_supabase_url
STAGING_SUPABASE_ANON_KEY=your_staging_anon_key
STAGING_STRIPE_SECRET_KEY=sk_test_your_staging_key
```

### 3. Production Environment (Vercel)

Set environment variables in Vercel dashboard with `PROD_` prefix:

```bash
PROD_SUPABASE_URL=your_production_supabase_url
PROD_SUPABASE_ANON_KEY=your_production_anon_key
PROD_STRIPE_SECRET_KEY=sk_live_your_production_key
```

## Usage in Code

### Import Configuration
```typescript
import { config, isProduction, isStaging, isDevelopment } from '@/lib/config'

// Access configuration
console.log(config.supabase.url)
console.log(config.stripe.secretKey)

// Environment checks
if (isProduction()) {
  // Production-only code
}
```

### Supabase Clients
```typescript
import { createClient } from '@/supabase/client'
import { createClient as createServerClient } from '@/supabase/server'

// Automatically uses correct environment variables
const supabase = createClient()
const serverSupabase = await createServerClient()
```

## Validation

The configuration system validates that all required variables are present on startup. If any are missing, the application will throw a descriptive error:

```
Missing required environment variable: SUPABASE_URL (environment: production)
```

## Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Use test keys in staging** - Always use Stripe test keys for non-production
3. **Rotate keys regularly** - Especially production keys
4. **Limit key permissions** - Use least-privilege principle
5. **Monitor key usage** - Set up alerts for unusual activity

## Debugging

### Check Current Configuration
Visit `/api/config` in your browser to see the current environment and configuration (sensitive values are hidden in production).

### Common Issues

1. **"Missing required environment variable"**
   - Check that the variable is set with the correct prefix
   - Verify the environment detection is working correctly

2. **Wrong environment detected**
   - Check `VERCEL_ENV` and `NODE_ENV` values
   - Use `/api/config` endpoint to debug

3. **Supabase connection fails**
   - Verify URL and keys are correct for the environment
   - Check that the Supabase project is accessible

## CI/CD Integration

The CI/CD pipeline automatically uses the correct environment variables:

- **PR builds**: Use staging variables
- **Main branch**: Deploy to staging with staging variables
- **Production**: Deploy with production variables (manual approval required)

Environment variables are set as GitHub Secrets with appropriate prefixes.

## Testing

Environment variable management is fully tested:

```bash
npm run test src/__tests__/lib/config.test.ts
```

Tests cover:
- Environment detection logic
- Variable resolution with prefixes
- Fallback behavior
- Validation rules
- Type guards