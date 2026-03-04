'use client'

import { useEffect } from 'react'

export function ViewTracker({ id }: { id: string }) {
  useEffect(() => {
    void fetch(`/api/assets/${id}/view`, { method: 'POST' })
  }, [id])

  return null
}
