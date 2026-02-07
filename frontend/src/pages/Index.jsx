import { useState, useEffect, lazy, Suspense } from "react"
import { useSearchParams } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import AppHeader from "@/components/app-header"
import { Footer } from "@/components/footer"

// Lazy load the heavy SimulatorGrid component
const SimulatorGrid = lazy(() => import("@/components/simulator-grid").then(module => ({ default: module.SimulatorGrid })))

// Loading component for the simulator grid
function SimulatorGridLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading simulator...</p>
      </div>
    </div>
  )
}

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [authView, setAuthView] = useState("login")
  const [authError, setAuthError] = useState(null)

  // Check for auth error from URL
  useEffect(() => {
    const error = searchParams.get("error")
    if (error === "auth_required") {
      setAuthError("You must be logged in to access the simulator.")
      // Clear the error from URL
      searchParams.delete("error")
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  return (
    <>
      <Helmet>
        <title>GroundCTRL - Virtual Satellite Simulator</title>
        <meta name="description" content="Browser-based training simulator for satellite operations. Learn fundamentals through interactive, guided missions with real-time AI guidance." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <AppHeader onAuthViewChange={setAuthView} />
        <Suspense fallback={<SimulatorGridLoader />}>
          <SimulatorGrid authView={authView} onAuthViewChange={setAuthView} authError={authError} />
        </Suspense>
        <Footer />
      </div>
    </>
  )
}
