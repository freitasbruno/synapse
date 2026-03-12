import { createClient } from '@/lib/supabase/server'
import type { AISystemPrompt, AISystemPromptVersion } from '@/lib/types/database'

export type { AISystemPrompt, AISystemPromptVersion }

export async function getAllSystemPrompts(): Promise<AISystemPrompt[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_system_prompts')
    .select('*')
    .order('key', { ascending: true })

  if (error) {
    console.error('[getAllSystemPrompts] Supabase error:', error.message)
    return []
  }

  return (data ?? []) as AISystemPrompt[]
}

export async function getSystemPromptByKey(key: string): Promise<AISystemPrompt | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_system_prompts')
    .select('*')
    .eq('key', key)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[getSystemPromptByKey] Supabase error:', error.message)
    }
    return null
  }

  return data as AISystemPrompt
}

export async function updateSystemPrompt(
  key: string,
  prompt: string,
  changedBy: string,
): Promise<AISystemPrompt | null> {
  const supabase = await createClient()

  // Save version snapshot before updating
  const current = await getSystemPromptByKey(key)
  if (current) {
    await supabase.from('ai_system_prompt_versions').insert({
      prompt_key: key,
      prompt: current.prompt,
      changed_by: changedBy,
    })

    // Trim version history to last 10 entries
    const { data: versions } = await supabase
      .from('ai_system_prompt_versions')
      .select('id, created_at')
      .eq('prompt_key', key)
      .order('created_at', { ascending: false })

    if (versions && versions.length > 10) {
      const toDelete = versions.slice(10).map((v) => v.id)
      await supabase.from('ai_system_prompt_versions').delete().in('id', toDelete)
    }
  }

  const { data, error } = await supabase
    .from('ai_system_prompts')
    .update({ prompt, updated_at: new Date().toISOString() })
    .eq('key', key)
    .select('*')
    .single()

  if (error) {
    console.error('[updateSystemPrompt] Supabase error:', error.message)
    return null
  }

  return data as AISystemPrompt
}

export async function resetSystemPrompt(
  key: string,
  changedBy: string,
): Promise<AISystemPrompt | null> {
  const current = await getSystemPromptByKey(key)
  if (!current) return null

  return updateSystemPrompt(key, current.default_prompt, changedBy)
}

export async function getPromptVersions(key: string): Promise<AISystemPromptVersion[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_system_prompt_versions')
    .select('*')
    .eq('prompt_key', key)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('[getPromptVersions] Supabase error:', error.message)
    return []
  }

  return (data ?? []) as AISystemPromptVersion[]
}
