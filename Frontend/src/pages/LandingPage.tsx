import {
  Navbar,
  Hero,
  Workflow,
  CleaningDemo,
  InsightsSection,
  VisualizationSection,
  AskDataSection,
  FinalCTA,
  Footer,
} from '@/components/landing'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-0 text-fg-0">
      <Navbar />
      <main>
        <Hero />
        <Workflow />
        <CleaningDemo />
        <InsightsSection />
        <VisualizationSection />
        <AskDataSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}