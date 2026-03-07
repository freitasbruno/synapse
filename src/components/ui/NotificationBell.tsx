'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { NotificationWithDetails } from '@/lib/types/database'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function getNotificationMessage(n: NotificationWithDetails): React.ReactNode {
  const actorName = n.actor?.display_name ?? 'Someone'
  const assetTitle = n.asset?.title ?? 'an asset'

  switch (n.type) {
    case 'new_star':
      return (
        <>
          ⭐ <strong>{actorName}</strong> starred your asset <strong>{assetTitle}</strong>
        </>
      )
    case 'new_comment':
      return (
        <>
          💬 <strong>{actorName}</strong> commented on <strong>{assetTitle}</strong>
        </>
      )
    case 'asset_validated':
      return (
        <>
          ✅ Your asset <strong>{assetTitle}</strong> was verified
        </>
      )
    case 'new_follower':
      return (
        <>
          👤 <strong>{actorName}</strong> started following you
        </>
      )
  }
}

function getNotificationHref(n: NotificationWithDetails): string {
  switch (n.type) {
    case 'new_star':
    case 'asset_validated':
      return `/asset/${n.asset_id}`
    case 'new_comment':
      return `/asset/${n.asset_id}#comments`
    case 'new_follower':
      return `/users/${n.actor_id}`
  }
}

function NotificationActorAvatar({ actor }: { actor: NotificationWithDetails['actor'] }) {
  const [photoError, setPhotoError] = useState(false)

  if (actor?.photo_url && !photoError) {
    return (
      <Image
        src={actor.photo_url}
        alt={actor.display_name}
        width={32}
        height={32}
        unoptimized
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-full"
        onError={() => setPhotoError(true)}
      />
    )
  }

  const initials = (actor?.display_name ?? '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      style={{
        width: 32,
        height: 32,
        backgroundColor: 'var(--accent)',
        color: '#fff',
        fontSize: 12,
      }}
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
    >
      {initials}
    </div>
  )
}

// ─── notification item ────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onRead,
  onDelete,
}: {
  notification: NotificationWithDetails
  onRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)

  async function handleClick() {
    if (!notification.read) {
      onRead(notification.id)
      await fetch(`/api/notifications/${notification.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })
    }
    router.push(getNotificationHref(notification))
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    onDelete(notification.id)
    await fetch(`/api/notifications/${notification.id}`, { method: 'DELETE' })
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => void handleClick()}
      onKeyDown={(e) => { if (e.key === 'Enter') void handleClick() }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:[background-color:var(--bg-border)]"
    >
      {/* Unread dot */}
      {!notification.read && (
        <div
          className="absolute left-1.5 top-4 h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: 'var(--accent)' }}
        />
      )}

      <NotificationActorAvatar actor={notification.actor} />

      <div className="min-w-0 flex-1">
        <p
          style={{ color: 'var(--text-primary)' }}
          className={`text-xs leading-snug ${notification.read ? 'opacity-70' : ''}`}
        >
          {getNotificationMessage(notification)}
        </p>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-0.5 text-[11px]">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>

      {/* Dismiss button */}
      {hovered && (
        <button
          type="button"
          onClick={(e) => void handleDelete(e)}
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded text-xs opacity-60 transition-opacity hover:opacity-100"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      )}
    </div>
  )
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div
        className="h-8 w-8 shrink-0 animate-pulse rounded-full"
        style={{ backgroundColor: 'var(--bg-border)' }}
      />
      <div className="flex-1 space-y-2">
        <div
          className="h-3 w-3/4 animate-pulse rounded"
          style={{ backgroundColor: 'var(--bg-border)' }}
        />
        <div
          className="h-2.5 w-1/3 animate-pulse rounded"
          style={{ backgroundColor: 'var(--bg-border)' }}
        />
      </div>
    </div>
  )
}

// ─── bell icon ────────────────────────────────────────────────────────────────

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Fetch unread count
  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?countOnly=true')
      if (!res.ok) return
      const { count } = (await res.json()) as { count: number }
      setUnreadCount(count)
    } catch {
      // ignore
    }
  }, [])

  // Fetch full list when panel opens
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications?limit=20')
      if (!res.ok) return
      const data = (await res.json()) as NotificationWithDetails[]
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.read).length)
    } catch {
      // ignore
    } finally {
      setLoading(false)
      setFetched(true)
    }
  }, [])

  // Initial count fetch + poll every 60s
  useEffect(() => {
    void fetchCount()
    const interval = setInterval(() => void fetchCount(), 60_000)
    return () => clearInterval(interval)
  }, [fetchCount])

  // Open/close panel
  useEffect(() => {
    if (open && !fetched) {
      void fetchNotifications()
    }
  }, [open, fetched, fetchNotifications])

  // Close on outside click or Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      document.addEventListener('keydown', handleKey)
    }
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  function handleRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  function handleDelete(id: string) {
    const n = notifications.find((x) => x.id === id)
    setNotifications((prev) => prev.filter((x) => x.id !== id))
    if (n && !n.read) setUnreadCount((c) => Math.max(0, c - 1))
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    await fetch('/api/notifications/read-all', { method: 'POST' })
  }

  const hasUnread = unreadCount > 0

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center rounded-md p-1 transition-colors hover:[color:var(--text-primary)]"
        style={{ color: 'var(--text-secondary)' }}
        aria-label={`Notifications${hasUnread ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
      >
        <BellIcon />
        {hasUnread && (
          <span
            className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] font-bold text-white ${hasUnread ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: '#ef4444' }}
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--bg-border)',
            width: 380,
            maxHeight: 480,
          }}
          className="absolute right-0 top-10 z-50 overflow-hidden rounded-xl border shadow-lg"
        >
          {/* Panel header */}
          <div
            style={{ borderBottomColor: 'var(--bg-border)' }}
            className="flex items-center justify-between border-b px-4 py-2.5"
          >
            <span style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">
              Notifications
            </span>
            <div className="flex items-center gap-3">
              {hasUnread && (
                <button
                  type="button"
                  onClick={() => void handleMarkAllRead()}
                  style={{ color: 'var(--text-secondary)' }}
                  className="text-xs transition-colors hover:[color:var(--text-primary)]"
                >
                  Mark all as read
                </button>
              )}
              <a
                href="/notifications"
                onClick={() => setOpen(false)}
                style={{ color: 'var(--accent)' }}
                className="text-xs hover:underline"
              >
                View all →
              </a>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : notifications.length === 0 ? (
              <p
                style={{ color: 'var(--text-secondary)' }}
                className="py-12 text-center text-sm"
              >
                You&apos;re all caught up ✓
              </p>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={handleRead}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
