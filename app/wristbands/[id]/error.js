// app/wristbands/[id]/error.js
'use client'

import ErrorBoundary from '@/components/ErrorBoundary'

export default function Error({ error }) {
  return <ErrorBoundary error={error} />
}