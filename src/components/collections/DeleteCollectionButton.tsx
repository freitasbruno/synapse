'use client'

interface Props {
  collectionTitle: string
  action: (formData: FormData) => void | Promise<void>
  collectionId: string
}

export function DeleteCollectionButton({ collectionTitle, action, collectionId }: Props) {
  return (
    <form action={action}>
      <input type="hidden" name="collectionId" value={collectionId} />
      <button
        type="submit"
        className="text-xs transition-opacity hover:opacity-70"
        style={{ color: '#ef4444' }}
        onClick={(e) => {
          if (!confirm(`Delete "${collectionTitle}"?`)) e.preventDefault()
        }}
      >
        Delete
      </button>
    </form>
  )
}
