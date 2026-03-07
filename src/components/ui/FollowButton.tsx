'use client'

import { useState } from 'react'
import Link from 'next/link'

interface FollowButtonProps {
  targetUserId: string
  initialFollowing: boolean
  initialFollowerCount: number
  isAuthenticated: boolean
}

export function FollowButton({
  targetUserId,
  initialFollowing,
  initialFollowerCount,
  isAuthenticated,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState(false)

  if (!isAuthenticated) {
    return (
      <Link
        href="/auth/signin"
        className="rounded-md border px-4 py-1.5 text-sm font-medium transition-colors hover:opacity-80"
        style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
      >
        Follow
      </Link>
    )
  }

  async function handleClick() {
    if (loading) return

    const prevFollowing = following
    const prevCount = followerCount
    setFollowing(!following)
    setFollowerCount(following ? followerCount - 1 : followerCount + 1)
    setLoading(true)

    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
      const data = (await res.json()) as { following: boolean }
      setFollowing(data.following)
      setFollowerCount(data.following ? prevCount + 1 : prevCount - 1)
    } catch {
      setFollowing(prevFollowing)
      setFollowerCount(prevCount)
    } finally {
      setLoading(false)
    }
  }

  if (following) {
    return (
      <button
        type="button"
        onClick={() => void handleClick()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={loading}
        className="rounded-md border px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
        style={{
          backgroundColor: hovered ? 'transparent' : 'var(--accent)',
          borderColor: hovered ? '#ef4444' : 'var(--accent)',
          color: hovered ? '#ef4444' : '#fff',
        }}
        aria-pressed={true}
        aria-label="Unfollow this creator"
      >
        {hovered ? 'Unfollow' : 'Following ✓'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-md border px-4 py-1.5 text-sm font-medium transition-colors hover:opacity-80 disabled:opacity-50"
      style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
      aria-pressed={false}
      aria-label="Follow this creator"
    >
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
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
      Follow
    </button>
  )
}

export { type FollowButtonProps }
