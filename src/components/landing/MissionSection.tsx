export function MissionSection() {
  return (
    <section className="relative px-4 py-24" style={{ backgroundColor: '#111111' }}>
      {/* Indigo top divider */}
      <div
        className="mx-auto mb-16 h-px max-w-5xl"
        style={{ backgroundColor: 'rgba(99,102,241,0.4)' }}
      />

      <div className="mx-auto max-w-3xl text-center">
        <h2
          className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl"
          style={{ fontFamily: 'var(--font-display)', color: '#ffffff' }}
        >
          AI knowledge should be open.
        </h2>
        <p className="text-base leading-relaxed sm:text-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
          The best prompts, the sharpest workflows, the most useful tools — they
          shouldn&apos;t live in private Notion docs or scattered across Discord servers.
          Synapse exists to centralise, validate, and freely share the AI knowledge that
          makes everyone more capable. Built by Bitlab. Open to everyone.
        </p>
      </div>
    </section>
  )
}
