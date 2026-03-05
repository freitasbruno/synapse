import { getPublishedAssetCount } from '@/lib/data/assets'
import { Header } from '@/components/layout/Header'
import { Hero } from '@/components/landing/Hero'
import { StatsBar } from '@/components/landing/StatsBar'
import { FeatureCards } from '@/components/landing/FeatureCards'
import { AssetTypes } from '@/components/landing/AssetTypes'
import { MissionSection } from '@/components/landing/MissionSection'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { LandingFooter } from '@/components/landing/LandingFooter'

export default async function LandingPage() {
  const assetCount = await getPublishedAssetCount()

  return (
    <div style={{ backgroundColor: '#0a0a0a' }}>
      <Header transparent />
      <Hero />
      <StatsBar assetCount={assetCount} />
      <FeatureCards />
      <AssetTypes />
      <MissionSection />
      <FinalCTA />
      <LandingFooter />
    </div>
  )
}
