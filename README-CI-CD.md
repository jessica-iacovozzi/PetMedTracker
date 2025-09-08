# CI/CD Pipeline Documentation

## Overview

This project uses GitHub Actions for continuous integration and deployment. The pipeline automates testing, building, and deployment processes to ensure code quality and reliable releases.

## Pipeline Stages

### 1. Build and Lint
- **Trigger**: Every PR and push to main/develop
- **Duration**: ~5 minutes
- **Actions**:
  - TypeScript type checking
  - ESLint code linting
  - Prettier formatting check
  - Application build

### 2. Unit Tests
- **Trigger**: After successful build
- **Duration**: ~3 minutes
- **Actions**:
  - Jest unit tests with coverage
  - Coverage report upload to Codecov
  - Minimum 80% coverage requirement

### 3. Integration Tests
- **Trigger**: After successful build
- **Duration**: ~5 minutes
- **Actions**:
  - Database integration tests
  - API endpoint testing
  - Service interaction validation

### 4. E2E Tests
- **Trigger**: After unit and integration tests pass
- **Duration**: ~10 minutes
- **Actions**:
  - Playwright browser tests
  - Full user journey validation
  - Screenshot capture on failures

### 5. Staging Deployment
- **Trigger**: Push to main branch (auto)
- **Duration**: ~5 minutes
- **Actions**:
  - Deploy to Vercel staging environment
  - Smoke tests on staging
  - Environment health checks

### 6. Production Deployment
- **Trigger**: Manual approval after staging
- **Duration**: ~8 minutes
- **Actions**:
  - Deploy to Vercel production
  - Production smoke tests
  - Rollback capability

## Environment Variables

### Required Secrets

#### Supabase (Test/Staging/Production)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

#### Stripe (Test/Staging/Production)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

#### Deployment
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Environment-Specific Variables

Prefix variables with environment name:
- `STAGING_*` for staging environment
- `PROD_*` for production environment

## Test Commands

```bash
# Run all tests
npm run ci:test

# Individual test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# With coverage
npm run test:coverage

# Watch mode (development)
npm run test:watch
```

## Quality Gates

### PR Requirements
- ✅ All tests must pass
- ✅ Code coverage ≥ 80%
- ✅ No linting errors
- ✅ Type checking passes
- ✅ Build succeeds
- ✅ Security scan passes

### Deployment Requirements
- ✅ All PR checks pass
- ✅ Manual approval for production
- ✅ Staging deployment successful
- ✅ Smoke tests pass

## Monitoring and Alerts

### Health Checks
- **Endpoint**: `/api/health`
- **Frequency**: Every deployment
- **Checks**: Database, environment variables, uptime

### Failure Notifications
- Failed builds notify via GitHub
- Deployment failures trigger alerts
- Test failures block merging

## Rollback Procedures

### Automatic Rollback
- Production smoke tests fail → automatic rollback
- Health check failures → alert for manual intervention

### Manual Rollback
1. Go to GitHub Actions
2. Find last successful deployment
3. Re-run production deployment job
4. Verify health checks pass

## Development Workflow

### Creating a PR
1. Create feature branch from `main`
2. Make changes and commit
3. Push branch and create PR
4. Wait for CI checks to pass
5. Request review from code owners
6. Merge after approval

### Deployment Process
1. Merge PR to `main`
2. Automatic staging deployment
3. QA validation on staging
4. Manual production deployment approval
5. Production deployment and monitoring

## Troubleshooting

### Common Issues

#### Tests Failing in CI but Passing Locally
- Check environment variables
- Verify Node.js version matches
- Clear npm cache: `npm ci`

#### Deployment Failures
- Check Vercel token validity
- Verify environment variables
- Check build logs for errors

#### E2E Test Timeouts
- Increase timeout in `playwright.config.ts`
- Check if dev server is starting properly
- Verify test database setup

### Getting Help
- Check GitHub Actions logs
- Review failed test outputs
- Contact DevOps team for deployment issues
- Check #ci-cd Slack channel

## Performance Metrics

### Target Times
- **PR Validation**: < 10 minutes
- **Staging Deployment**: < 5 minutes
- **Production Deployment**: < 8 minutes
- **Full Pipeline**: < 25 minutes

### Success Rates
- **Target**: > 95% success rate
- **Monitoring**: Weekly pipeline health reports
- **Optimization**: Monthly pipeline review
