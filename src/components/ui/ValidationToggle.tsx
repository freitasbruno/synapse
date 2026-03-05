'use client'

import { useState } from 'react'
import { Toast } from '@/components/ui/Toast'

interface ValidationToggleProps {
  assetId: string
  initialValidated: boolean
}

function ShieldIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

export function ValidationToggle({ assetId, initialValidated }: ValidationToggleProps) {
  const [validated, setValidated] = useState(initialValidated)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleClick() {
    if (loading) return

    const prev = validated
    setValidated(!validated)
    setLoading(true)

    try {
      const res = await fetch(`/api/assets/${assetId}/validate`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to update validation status')
      const data = (await res.json()) as { is_manager_validated: boolean }
      setValidated(data.is_manager_validated)
    } catch {
      setValidated(prev)
      setErrorMsg('Could not update validation status. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4">
      <p
        style={{ color: 'var(--text-secondary)' }}
        className="mb-1.5 text-xs font-medium uppercase tracking-wide"
      >
        Manager Controls
      </p>

      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-all disabled:opacity-50"
        style={
          validated
            ? {
                backgroundColor: '#FFD700',
                borderColor: '#FFD700',
                color: '#1a1200',
              }
            : {
                backgroundColor: 'transparent',
                borderColor: 'rgba(255,215,0,0.5)',
                color: '#FFD700',
              }
        }
      >
        <ShieldIcon />
        {validated ? '✓ Verified' : 'Mark as Verified'}
      </button>

      {errorMsg && (
        <Toast message={errorMsg} onDismiss={() => setErrorMsg(null)} />
      )}
    </div>
  )
}
