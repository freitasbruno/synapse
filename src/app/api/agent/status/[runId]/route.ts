import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getAgentRun, getAgentCandidates } from '@/lib/data/agent'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { runId } = await params

  const run = await getAgentRun(runId)
  if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 })

  const allCandidates = await getAgentCandidates(runId)

  // Candidates summary
  const summary = {
    found: allCandidates.length,
    passed_evaluation: allCandidates.filter((c) => c.passed_evaluation === true).length,
    passed_dedup: allCandidates.filter((c) => c.passed_deduplication === true).length,
    drafted: allCandidates.filter((c) => c.status === 'drafted').length,
  }

  // Most recently updated 5 candidates for live preview
  // Sort by created_at DESC as a proxy (candidates are inserted in order)
  const recentCandidates = [...allCandidates]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      evaluation_score: c.evaluation_score,
      source_url: c.source_url,
    }))

  return NextResponse.json({ run, summary, recentCandidates })
}
