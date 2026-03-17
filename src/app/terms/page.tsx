import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Synapse',
}

export default function TermsPage() {
  return (
    <div
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}
      className="min-h-screen px-4 py-16"
    >
      <article className="mx-auto max-w-2xl space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-2 text-sm">
            Last updated: 17 March 2025
          </p>
        </div>

        {/* 1. Introduction */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">1. Introduction</h2>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm leading-relaxed">
            Synapse is a platform operated by <strong style={{ color: 'var(--text-primary)' }}>Bitlab</strong> for
            discovering and sharing AI assets — prompts, agents, apps, and workflows. By accessing or using Synapse
            you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform.
          </p>
        </section>

        {/* 2. Eligibility */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">2. Eligibility</h2>
          <ul style={{ color: 'var(--text-secondary)' }} className="space-y-2 text-sm leading-relaxed list-disc list-inside">
            <li>You must be at least 16 years of age to use Synapse.</li>
            <li>You must have the legal capacity to enter into a binding agreement.</li>
          </ul>
        </section>

        {/* 3. Your Account */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">3. Your Account</h2>
          <ul style={{ color: 'var(--text-secondary)' }} className="space-y-2 text-sm leading-relaxed list-disc list-inside">
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>Each person may hold one account only.</li>
            <li>You must provide accurate information at registration and keep it up to date.</li>
          </ul>
        </section>

        {/* 4. User Content */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">4. User Content</h2>
          <ul style={{ color: 'var(--text-secondary)' }} className="space-y-2 text-sm leading-relaxed list-disc list-inside">
            <li>You retain ownership of any content you submit to Synapse.</li>
            <li>
              By submitting content, you grant Synapse a non-exclusive, royalty-free licence to display and
              distribute that content on the platform.
            </li>
            <li>You confirm that you have the right to share any content you submit.</li>
            <li>
              You are responsible for ensuring that submitted content does not infringe any third-party intellectual
              property or other rights.
            </li>
          </ul>
        </section>

        {/* 5. Prohibited Use */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">5. Prohibited Use</h2>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm leading-relaxed">
            You may not use Synapse to:
          </p>
          <ul style={{ color: 'var(--text-secondary)' }} className="space-y-2 text-sm leading-relaxed list-disc list-inside">
            <li>Submit harmful, illegal, or malicious content.</li>
            <li>Attempt to abuse, scrape, or overload the platform.</li>
            <li>Impersonate other users or organisations.</li>
            <li>Submit content that violates third-party intellectual property rights.</li>
            <li>Distribute malware, harmful prompts, or other malicious code.</li>
          </ul>
        </section>

        {/* 6. AI-Generated Content */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">6. AI-Generated Content</h2>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm leading-relaxed">
            Some assets on Synapse are drafted by an AI research agent and reviewed by platform managers before
            publication. AI-generated assets are labelled as such. Synapse does not guarantee the accuracy,
            completeness, or fitness for purpose of any AI-generated content. Always review AI-generated content
            carefully before using it in production.
          </p>
        </section>

        {/* 7. Moderation */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">7. Moderation</h2>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm leading-relaxed">
            Synapse reserves the right to remove any content that violates these terms without prior notice. Repeat
            violations may result in account suspension or permanent termination.
          </p>
        </section>

        {/* 8. Intellectual Property */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">8. Intellectual Property</h2>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm leading-relaxed">
            The Synapse platform, branding, and all original content created by Bitlab are owned by Bitlab. The
            Synapse name and logo may not be used without prior written permission from Bitlab.
          </p>
        </section>

        {/* 9. Disclaimer of Warranties */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">9. Disclaimer of Warranties</h2>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm leading-relaxed">
            The platform is provided &quot;as is&quot; without warranties of any kind, express or implied. AI
            features may produce inaccurate or inappropriate outputs — always review AI-generated content before
            use in production environments.
          </p>
        </section>

        {/* 10. Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">10. Limitation of Liability</h2>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm leading-relaxed">
            To the maximum extent permitted by law, Bitlab is not liable for any indirect, incidental, special, or
            consequential damages arising from your use of, or inability to use, the platform.
          </p>
        </section>

        {/* 11. Governing Law */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">11. Governing Law</h2>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm leading-relaxed">
            These terms are governed by and construed in accordance with the laws of Portugal.
          </p>
        </section>

        {/* 12. Changes to Terms */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">12. Changes to Terms</h2>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm leading-relaxed">
            We will notify users of material changes to these terms via email. Continued use of the platform after
            changes are posted constitutes your acceptance of the updated terms.
          </p>
        </section>

        {/* 13. Contact */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">13. Contact</h2>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm leading-relaxed">
            For any questions about these terms, contact us at{' '}
            <a href="mailto:hello@bitlab.pt" style={{ color: 'var(--accent)' }} className="hover:underline">
              hello@bitlab.pt
            </a>.
          </p>
        </section>

        {/* Footer nav */}
        <div
          className="border-t pt-6 text-sm"
          style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
        >
          <Link href="/privacy" style={{ color: 'var(--accent)' }} className="hover:underline">
            Privacy Policy →
          </Link>
        </div>

      </article>
    </div>
  )
}
