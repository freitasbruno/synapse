import { Header } from '@/components/layout/Header'

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
          Coming soon: Discovery Gallery
        </p>
      </main>
    </>
  )
}
