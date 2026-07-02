import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? 'development',
  release: process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA,

  tracesSampleRate: 0.2,
})
