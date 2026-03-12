export const ATTACHMENT_CONFIG = {
  MAX_PER_ASSET: 5,
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_SIZE_LABEL: '10MB',
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/markdown',
    'application/json',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  ALLOWED_EXTENSIONS: [
    '.pdf', '.csv', '.xls', '.xlsx',
    '.txt', '.md', '.json', '.doc', '.docx',
  ],
  SIGNED_URL_EXPIRY_SECONDS: 3600, // 1 hour
}

export function getFileTypeIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return '📄'
  if (
    mimeType === 'text/csv' ||
    mimeType.includes('excel') ||
    mimeType.includes('spreadsheet')
  )
    return '📊'
  if (mimeType === 'application/json') return '🔧'
  if (mimeType.includes('word') || mimeType.includes('wordprocessing')) return '📝'
  if (mimeType === 'text/plain' || mimeType === 'text/markdown') return '📃'
  return '📎'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
