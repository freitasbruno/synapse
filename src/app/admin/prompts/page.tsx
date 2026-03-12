import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { getAllSystemPrompts } from '@/lib/data/ai-prompts'
import { PromptCard } from '@/components/admin/PromptCard'

export default async function AdminPromptsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'manager') redirect('/dashboard')

  const prompts = await getAllSystemPrompts()

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold tracking-tight">
          AI Prompts
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">
          Edit system prompts for every AI feature. Changes take effect immediately — no deploy needed.
        </p>
      </div>

      <div className="space-y-4">
        {prompts.map((prompt) => (
          <PromptCard key={prompt.key} prompt={prompt} />
        ))}
      </div>
    </div>
  )
}
