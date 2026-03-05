// Shared "Verified by Synapse managers" badge.
// Used on AssetCard (gallery) and the Asset Detail page.

function ShieldCheckIcon() {
  return (
    <svg
      width="13"
      height="13"
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

interface GoldBadgeProps {
  /** Use 'sm' on gallery cards, 'md' on the detail page */
  size?: 'sm' | 'md'
}

export function GoldBadge({ size = 'md' }: GoldBadgeProps) {
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-0.5'
  const text = size === 'sm' ? 'text-[10px]' : 'text-xs'

  return (
    <span
      title="Verified by Synapse managers"
      className={`inline-flex items-center gap-1 rounded-full border font-medium drop-shadow-[0_0_4px_rgba(255,215,0,0.5)] ${padding} ${text}`}
      style={{
        color: '#FFD700',
        borderColor: 'rgba(255,215,0,0.3)',
        backgroundColor: 'rgba(255,215,0,0.08)',
      }}
    >
      <ShieldCheckIcon />
      Verified
    </span>
  )
}
