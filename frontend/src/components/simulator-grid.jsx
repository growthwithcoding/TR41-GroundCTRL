"use client"

import { Satellite, Rocket, Radio, Gauge, Play, Clock } from "lucide-react"
import { AuthForm } from "@/components/auth-form"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "react-router-dom"

export function SimulatorGrid({ authView, onAuthViewChange, authError }) {
  const { user } = useAuth()

  return (
    <main className="flex-1 flex">
      {/* Hero Section */}
      <section className="flex-1 bg-background flex flex-col items-center justify-center px-8 py-16 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-3xl text-center space-y-6 relative z-10">
          {/* Logo and Title */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <Satellite className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground text-balance tracking-tight">
            GroundCTRL
          </h1>
          <p className="text-xl md:text-2xl text-primary font-medium text-balance">
            Virtual Satellite Simulator
          </p>
          
          <p className="text-lg text-foreground/80 leading-relaxed text-pretty max-w-2xl mx-auto">
            GroundCTRL is a browser-based training simulator that introduces users to the fundamentals of satellite
            operations through interactive, guided missions. Players manage a virtual Earth-orbiting satellite using a
            simplified mission console, real-time AI guidance, and structured objectives that blend learning with
            gameplay.
          </p>
          
          <p className="text-base text-muted-foreground text-pretty max-w-2xl mx-auto">
            Designed for space enthusiasts, students, and new operators, the platform provides visual feedback,
            step-by-step tutorials, and progress tracking. The simulator runs in modern desktop browsers and aims to
            make satellite operations education engaging, accessible, and beginner-friendly.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
              <Rocket className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Orbital Mechanics</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
              <Radio className="w-4 h-4 text-status-nominal" />
              <span className="text-sm font-medium text-foreground">Real-time Telemetry</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
              <Gauge className="w-4 h-4 text-status-warning" />
              <span className="text-sm font-medium text-foreground">Mission Control</span>
            </div>
          </div>
          
          {/* Tech stack */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">React</span>
            <span className="px-3 py-1 rounded-full bg-status-nominal/10 text-status-nominal font-medium">Node.js</span>
            <span className="px-3 py-1 rounded-full bg-status-warning/10 text-status-warning font-medium">Firebase</span>
          </div>
        </div>
      </section>

      {/* Auth Sidebar or Mission Suggestions */}
      <aside className="w-[25%] min-w-[320px] border-l border-border bg-card flex items-center justify-center p-8">
        <div className="w-full space-y-4">
          {authError && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
              {authError}
            </div>
          )}
          
          {!user ? (
            <AuthForm view={authView} onViewChange={onAuthViewChange} />
          ) : (
            <div className="space-y-6">
              {/* Welcome Message */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  Welcome back, {user.displayName || "Operator"}!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ready for your next mission?
                </p>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <Button asChild className="w-full" size="lg">
                  <Link to="/dashboard">
                    <Gauge className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link to="/missions">
                    <Rocket className="w-4 h-4 mr-2" />
                    Browse Missions
                  </Link>
                </Button>
              </div>

              {/* Suggested Missions */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
                  Suggested Missions
                </h3>
                
                <Card className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Play className="w-4 h-4 text-primary" />
                      First Contact
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Beginner • 15 min
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-xs text-muted-foreground mb-3">
                      Learn the basics of satellite operations and establish your first connection.
                    </p>
                    <Button asChild size="sm" className="w-full">
                      <Link to="/simulator">
                        Start Mission
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-border hover:border-primary/20 transition-colors cursor-pointer">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      Orbital Mechanics 101
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Intermediate • 30 min
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-xs text-muted-foreground mb-3">
                      Master orbital dynamics and trajectory planning.
                    </p>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link to="/missions">
                        View Details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </aside>
    </main>
  )
}
