import { createClient } from '@/lib/supabase/server'
import type { NotificationWithDetails } from '@/lib/types/database'

export async function getNotifications(
  userId: string,
  limit = 20,
): Promise<NotificationWithDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .select(
      'id, user_id, type, actor_id, asset_id, collection_id, read, created_at, actor:users!actor_id ( id, display_name, photo_url ), asset:assets!asset_id ( id, title, type )',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getNotifications] error:', error.message)
    return []
  }

  return (data ?? []) as unknown as NotificationWithDetails[]
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_unread_notification_count', {
    p_user_id: userId,
  })
  if (error) {
    console.error('[getUnreadCount] error:', error.message)
    return 0
  }
  return (data as number) ?? 0
}

export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
  if (error) {
    console.error('[markAsRead] error:', error.message)
  }
}

export async function markAllAsRead(userId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('mark_all_notifications_read', { p_user_id: userId })
  if (error) {
    console.error('[markAllAsRead] error:', error.message)
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('notifications').delete().eq('id', notificationId)
  if (error) {
    console.error('[deleteNotification] error:', error.message)
  }
}
