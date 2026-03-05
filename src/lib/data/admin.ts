import { createClient } from '@/lib/supabase/server'

// ─── helpers ──────────────────────────────────────────────────────────────────

function last30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })
}

// ─── types ────────────────────────────────────────────────────────────────────

export type AdminAsset = {
  id: string
  title: string
  type: 'prompt' | 'tool' | 'app' | 'workflow'
  status: 'draft' | 'published'
  is_manager_validated: boolean
  creator_id: string
  creator_name: string
  created_at: string
  star_count: number
}

export type AdminOverviewStats = {
  totalMembers: number
  newMembersThisWeek: number
  totalAssets: number
  publishedAssets: number
  draftAssets: number
  validatedAssets: number
  validationRatio: number
  totalStars: number
  assetsByType: { type: string; count: number }[]
  newAssetsThisWeek: number
  dailyAssets: { date: string; count: number }[]
}

export type AIUsageStats = {
  totalRefinements: number
  totalTagSuggestions: number
  totalTokensInput: number
  totalTokensOutput: number
  estimatedCostUSD: number
  estimatedCostThisMonthUSD: number
  avgTokensPerCall: number
  topUsersByUsage: {
    userId: string
    displayName: string
    refinements: number
    tagSuggestions: number
    tokens: number
    estimatedCost: number
  }[]
  dailyUsage: { date: string; calls: number; tokens: number }[]
}

// ─── US 6.2 — Platform Growth & Content Analytics ────────────────────────────

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const supabase = await createClient()

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    usersCountRes,
    newMembersRes,
    assetsRes,
    recentAssetsRes,
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    supabase.from('assets').select('status, is_manager_validated, type, star_count, created_at'),
    supabase.from('assets').select('created_at').eq('status', 'published').gte('created_at', thirtyDaysAgo),
  ])

  const allAssets = (assetsRes.data ?? []) as Array<{
    status: string
    is_manager_validated: boolean
    type: string
    star_count: number
    created_at: string
  }>

  const published = allAssets.filter((a) => a.status === 'published')
  const validated = allAssets.filter((a) => a.is_manager_validated)
  const totalStars = allAssets.reduce((sum, a) => sum + (a.star_count ?? 0), 0)
  const newAssetsThisWeek = allAssets.filter(
    (a) => a.status === 'published' && a.created_at >= weekAgo,
  ).length

  const typeCounts: Record<string, number> = {}
  for (const asset of published) {
    typeCounts[asset.type] = (typeCounts[asset.type] ?? 0) + 1
  }
  const assetsByType = Object.entries(typeCounts).map(([type, count]) => ({ type, count }))

  const days = last30Days()
  const dailyMap: Record<string, number> = {}
  for (const asset of recentAssetsRes.data ?? []) {
    const day = (asset.created_at as string).split('T')[0]
    dailyMap[day] = (dailyMap[day] ?? 0) + 1
  }
  const dailyAssets = days.map((date) => ({ date, count: dailyMap[date] ?? 0 }))

  return {
    totalMembers: usersCountRes.count ?? 0,
    newMembersThisWeek: newMembersRes.count ?? 0,
    totalAssets: allAssets.length,
    publishedAssets: published.length,
    draftAssets: allAssets.length - published.length,
    validatedAssets: validated.length,
    validationRatio:
      published.length > 0 ? Math.round((validated.length / published.length) * 100) : 0,
    totalStars,
    assetsByType,
    newAssetsThisWeek,
    dailyAssets,
  }
}

// ─── US 6.1 — AI Operational Cost & Usage Monitoring ─────────────────────────

export async function getAIUsageStats(): Promise<AIUsageStats> {
  const supabase = await createClient()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [allLogsRes, recentLogsRes, monthLogsRes] = await Promise.all([
    supabase.from('ai_usage_logs').select('*'),
    supabase.from('ai_usage_logs').select('*').gte('created_at', thirtyDaysAgo),
    supabase
      .from('ai_usage_logs')
      .select('tokens_input, tokens_output')
      .gte('created_at', startOfMonth),
  ])

  const allLogs = (allLogsRes.data ?? []) as Array<{
    id: string
    user_id: string
    type: string
    tokens_input: number
    tokens_output: number
    created_at: string
  }>
  const recentLogs = (recentLogsRes.data ?? []) as typeof allLogs
  const monthLogs = (monthLogsRes.data ?? []) as Array<{
    tokens_input: number
    tokens_output: number
  }>

  const totalRefinements = allLogs.filter((l) => l.type === 'refinement').length
  const totalTagSuggestions = allLogs.filter((l) => l.type === 'tag_suggestion').length
  const totalTokensInput = allLogs.reduce((sum, l) => sum + l.tokens_input, 0)
  const totalTokensOutput = allLogs.reduce((sum, l) => sum + l.tokens_output, 0)
  const estimatedCostUSD = (totalTokensInput * 3 + totalTokensOutput * 15) / 1_000_000

  const monthIn = monthLogs.reduce((sum, l) => sum + l.tokens_input, 0)
  const monthOut = monthLogs.reduce((sum, l) => sum + l.tokens_output, 0)
  const estimatedCostThisMonthUSD = (monthIn * 3 + monthOut * 15) / 1_000_000

  const totalCalls = totalRefinements + totalTagSuggestions
  const avgTokensPerCall =
    totalCalls > 0 ? Math.round((totalTokensInput + totalTokensOutput) / totalCalls) : 0

  // Aggregate per user
  const userAgg: Record<
    string,
    { refinements: number; tagSuggestions: number; tokensIn: number; tokensOut: number }
  > = {}
  for (const log of allLogs) {
    if (!userAgg[log.user_id]) {
      userAgg[log.user_id] = { refinements: 0, tagSuggestions: 0, tokensIn: 0, tokensOut: 0 }
    }
    if (log.type === 'refinement') userAgg[log.user_id].refinements++
    else if (log.type === 'tag_suggestion') userAgg[log.user_id].tagSuggestions++
    userAgg[log.user_id].tokensIn += log.tokens_input
    userAgg[log.user_id].tokensOut += log.tokens_output
  }

  // Fetch display names
  const userIds = Object.keys(userAgg)
  let userNames: { id: string; display_name: string }[] = []
  if (userIds.length > 0) {
    const { data } = await supabase.from('users').select('id, display_name').in('id', userIds)
    userNames = (data ?? []) as { id: string; display_name: string }[]
  }
  const nameMap = new Map(userNames.map((u) => [u.id, u.display_name]))

  const topUsersByUsage = Object.entries(userAgg)
    .map(([userId, s]) => ({
      userId,
      displayName: nameMap.get(userId) ?? 'Unknown',
      refinements: s.refinements,
      tagSuggestions: s.tagSuggestions,
      tokens: s.tokensIn + s.tokensOut,
      estimatedCost: (s.tokensIn * 3 + s.tokensOut * 15) / 1_000_000,
    }))
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 10)

  // Daily usage over last 30 days
  const days = last30Days()
  const dailyMap: Record<string, { calls: number; tokens: number }> = {}
  for (const log of recentLogs) {
    const day = log.created_at.split('T')[0]
    if (!dailyMap[day]) dailyMap[day] = { calls: 0, tokens: 0 }
    dailyMap[day].calls++
    dailyMap[day].tokens += log.tokens_input + log.tokens_output
  }
  const dailyUsage = days.map((date) => ({
    date,
    ...(dailyMap[date] ?? { calls: 0, tokens: 0 }),
  }))

  return {
    totalRefinements,
    totalTagSuggestions,
    totalTokensInput,
    totalTokensOutput,
    estimatedCostUSD,
    estimatedCostThisMonthUSD,
    avgTokensPerCall,
    topUsersByUsage,
    dailyUsage,
  }
}

// ─── US 6.3 — Administrative Content Oversight ───────────────────────────────

export async function getAdminAssets(): Promise<AdminAsset[]> {
  const supabase = await createClient()

  const { data: assets, error } = await supabase
    .from('assets')
    .select('id, title, type, status, is_manager_validated, creator_id, created_at, star_count')
    .order('created_at', { ascending: false })

  if (error || !assets) {
    console.error('[getAdminAssets] error:', error?.message)
    return []
  }

  const rows = assets as Array<{
    id: string
    title: string
    type: 'prompt' | 'tool' | 'app' | 'workflow'
    status: 'draft' | 'published'
    is_manager_validated: boolean
    creator_id: string
    created_at: string
    star_count: number
  }>

  const creatorIds = [...new Set(rows.map((a) => a.creator_id))]
  let creatorNames: { id: string; display_name: string }[] = []
  if (creatorIds.length > 0) {
    const { data } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', creatorIds)
    creatorNames = (data ?? []) as { id: string; display_name: string }[]
  }
  const nameMap = new Map(creatorNames.map((u) => [u.id, u.display_name]))

  return rows.map((asset) => ({
    ...asset,
    creator_name: nameMap.get(asset.creator_id) ?? 'Unknown',
  }))
}
