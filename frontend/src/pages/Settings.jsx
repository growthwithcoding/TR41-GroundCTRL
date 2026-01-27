import { useEffect } from "react"
import { Helmet } from "react-helmet-async"
import { useNavigate } from "react-router-dom"
import AppHeader from "@/components/app-header"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Bell, Globe, Palette, Satellite, Settings as SettingsIcon } from "lucide-react"
import { Footer } from "@/components/footer"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (!loading && !user) {
      navigate("/")
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <Helmet>
        <title>Settings - GroundCTRL</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <main className="flex-1 p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* NASA-style header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <div className="flex items-center gap-2 text-primary text-xs font-mono tracking-wider mb-1">
                  <SettingsIcon className="h-3 w-3" />
                  SYSTEM CONFIGURATION
                </div>
                <h1 className="text-2xl font-bold text-foreground">Control Settings</h1>
                <p className="text-muted-foreground">Configure your Mission Control environment</p>
              </div>
            </div>

            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize how Mission Control looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Theme</p>
                    <p className="text-sm text-muted-foreground">Select your preferred theme</p>
                  </div>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notifications UI removed as part of system cleanup */}

            {/* Regional */}
            <Card className="border-dashed border-muted-foreground/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-5 w-5" />
                  Regional Configuration
                </CardTitle>
                <CardDescription>Language, timezone and regional preferences - Coming soon</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Under Development</p>
                    <p className="text-xs text-muted-foreground">
                      Regional and localization settings will be available in a future update.
                    </p>
                  </div>
                </div>
                <div className="opacity-50 pointer-events-none space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Language</p>
                      <p className="text-sm text-muted-foreground">Select your language</p>
                    </div>
                    <Select value="en" disabled>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Timezone</p>
                      <p className="text-sm text-muted-foreground">Set your timezone</p>
                    </div>
                    <Select value="UTC" disabled>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Simulator */}
            <Card className="border-dashed border-muted-foreground/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <Satellite className="h-5 w-5" />
                  Simulator Configuration
                </CardTitle>
                <CardDescription>Advanced simulator preferences - Coming soon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Satellite className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Under Development</p>
                    <p className="text-xs text-muted-foreground">
                      Simulator configuration options will be available in a future update.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full">
              Save Configuration
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
