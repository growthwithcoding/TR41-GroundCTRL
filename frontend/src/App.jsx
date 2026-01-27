import { Routes, Route } from 'react-router-dom'
import { Providers } from '@/components/providers.jsx'

// Lazy load pages for code splitting
import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Pages
const HomePage = lazy(() => import('@/pages/Index.jsx'))
const DashboardPage = lazy(() => import('@/pages/Dashboard.jsx'))
const SimulatorPage = lazy(() => import('@/pages/Simulator.jsx'))
const MissionsPage = lazy(() => import('@/pages/Missions.jsx'))
const AccountPage = lazy(() => import('@/pages/Account.jsx'))
const SettingsPage = lazy(() => import('@/pages/Settings.jsx'))
const ContactPage = lazy(() => import('@/pages/Contact.jsx'))
const HelpPage = lazy(() => import('@/pages/Help.jsx'))
const HelpArticlePage = lazy(() => import('@/pages/HelpArticle.jsx'))
const MissionBriefingPage = lazy(() => import('@/pages/MissionBriefing.jsx'))
const WebSocketTestPage = lazy(() => import('@/pages/WebSocketTest.jsx'))
const PrivacyPage = lazy(() => import('@/pages/Privacy.jsx'))
const TermsPage = lazy(() => import('@/pages/Terms.jsx'))
const NotFoundPage = lazy(() => import('@/pages/NotFound.jsx'))

// Loading component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

function App() {
  return (
    <Providers>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/help/article/:slug" element={<HelpArticlePage />} />
          <Route path="/mission-briefing/:id" element={<MissionBriefingPage />} />
          <Route path="/websocket-test" element={<WebSocketTestPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Providers>
  )
}

export default App
