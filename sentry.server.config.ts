import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? 'development',
  release: process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA,

  tracesSampleRate: 0.2,

  integrations: [
    Sentry.prismaIntegration(),
  ],

  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers['authorization']
      delete event.request.headers['cookie']
    }
    return event
  },

  ignoreErrors: [
    'NEXT_REDIRECT',
    'NEXT_NOT_FOUND',
  ],
})
