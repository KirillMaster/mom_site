'use client'

import { useEffect } from 'react'
import { captureUtm } from '@/lib/utm'

export default function UtmTracker() {
  useEffect(() => {
    captureUtm()
  }, [])

  return null
}
