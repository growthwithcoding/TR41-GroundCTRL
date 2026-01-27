import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import AppHeader from "@/components/app-header"
import { SimulatorGrid } from "@/components/simulator-grid"
import { Footer } from "@/components/footer"

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
        <SimulatorGrid authView={authView} onAuthViewChange={setAuthView} authError={authError} />
        <Footer />
      </div>
    </>
  )
}
