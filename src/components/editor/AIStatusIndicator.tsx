'use client'

interface AIStatusIndicatorProps {
  message: string
}

export function AIStatusIndicator({ message }: AIStatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
            style={{
              backgroundColor: 'var(--accent)',
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
      </div>
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {message}
      </span>
    </div>
  )
}
