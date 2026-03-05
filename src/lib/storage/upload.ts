/*
 * IMPORTANT: Before using this module, configure Supabase Storage manually:
 * 1. Create a storage bucket named "assets" in the Supabase dashboard
 * 2. Set it to private (not public)
 * 3. Add a policy: authenticated users can upload to their own folder
 *    (path starts with assets/{user_id}/)
 * 4. Add a policy: public can read all files in the bucket
 *    (for displaying images/videos to visitors)
 */

import { createClient } from '@/lib/supabase/client'

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * Calls onProgress(0) before upload and onProgress(100) after completion.
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  onProgress?.(0)

  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true })

  if (error) {
    throw new Error(error.message)
  }

  onProgress?.(100)

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path)

  return publicUrl
}

/** Removes a file from Supabase Storage. Errors are logged but not thrown. */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) {
    console.error('[deleteFile] Storage error:', error.message)
  }
}
