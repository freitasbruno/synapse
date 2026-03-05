import type { EditorBlock } from '@/components/editor/SequenceBuilder'

/**
 * Joins all text blocks into a single string and appends the prompt
 * content field if present. Used to build the content payload for AI calls.
 */
export function assembleAssetContent(blocks: EditorBlock[], content?: string): string {
  const parts: string[] = []

  for (const block of blocks) {
    if (block.type === 'text' && block.content.trim()) {
      parts.push(block.content.trim())
    }
  }

  if (content?.trim()) parts.push(content.trim())

  return parts.join('\n\n')
}
