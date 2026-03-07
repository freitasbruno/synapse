import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { getCurrentUser } from '@/lib/auth/session'
import { getNotifications, markAllAsRead } from '@/lib/data/notifications'
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

function getNotificationText(n: NotificationWithDetails): string {
  const actorName = n.actor?.display_name ?? 'Someone'
  const assetTitle = n.asset?.title ?? 'an asset'
  switch (n.type) {
    case 'new_star':
      return `⭐ ${actorName} starred your asset "${assetTitle}"`
    case 'new_comment':
      return `💬 ${actorName} commented on "${assetTitle}"`
    case 'asset_validated':
      return `✅ Your asset "${assetTitle}" was verified`
    case 'new_follower':
      return `👤 ${actorName} started following you`
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

function ActorAvatar({ actor }: { actor: NotificationWithDetails['actor'] }) {
  if (actor?.photo_url) {
    return (
      <Image
        src={actor.photo_url}
        alt={actor.display_name}
        width={40}
        height={40}
        unoptimized
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-full"
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
        width: 40,
        height: 40,
        backgroundColor: 'var(--accent)',
        color: '#fff',
        fontSize: 14,
      }}
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
    >
      {initials}
    </div>
  )
}

// ─── notification row ─────────────────────────────────────────────────────────

function NotificationRow({ n }: { n: NotificationWithDetails }) {
  return (
    <Link
      href={getNotificationHref(n)}
      className="relative flex items-start gap-4 rounded-xl border px-4 py-3.5 transition-colors hover:[border-color:var(--accent)]"
      style={{
        backgroundColor: n.read ? 'var(--bg-surface)' : 'var(--bg)',
        borderColor: 'var(--bg-border)',
      }}
    >
      {!n.read && (
        <div
          className="absolute left-2 top-5 h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: 'var(--accent)' }}
        />
      )}
      <ActorAvatar actor={n.actor} />
      <div className="min-w-0 flex-1">
        <p
          style={{ color: 'var(--text-primary)' }}
          className={`text-sm leading-snug ${n.read ? 'opacity-70' : 'font-medium'}`}
        >
          {getNotificationText(n)}
        </p>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-0.5 text-xs">
          {formatRelativeTime(n.created_at)}
        </p>
      </div>
    </Link>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')

  const notifications = await getNotifications(user.id, 50)
  const hasUnread = notifications.some((n) => !n.read)

  async function handleMarkAll() {
    'use server'
    const current = await getCurrentUser()
    if (current) await markAllAsRead(current.id)
    redirect('/notifications')
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/"
              style={{ color: 'var(--text-secondary)' }}
              className="mb-2 inline-flex items-center gap-1 text-sm transition-colors hover:[color:var(--text-primary)]"
            >
              ← Back
            </Link>
            <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold">
              Notifications
            </h1>
          </div>
          {hasUnread && (
            <form action={handleMarkAll}>
              <button
                type="submit"
                style={{ color: 'var(--text-secondary)' }}
                className="text-sm transition-colors hover:[color:var(--text-primary)]"
              >
                Mark all as read
              </button>
            </form>
          )}
        </div>

        {notifications.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }} className="py-16 text-center text-sm">
            No notifications yet
          </p>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <NotificationRow key={n.id} n={n} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
