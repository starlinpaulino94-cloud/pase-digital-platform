import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    throw new Error('MembeGo Debug: Server-side API route test error')
  } catch (e) {
    Sentry.captureException(e)
    return NextResponse.json({ error: 'Test error sent to Sentry', timestamp: new Date().toISOString() })
  }
}
