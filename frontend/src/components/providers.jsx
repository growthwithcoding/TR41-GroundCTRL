
"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"
import { WebSocketProvider } from "@/contexts/WebSocketContext"
import { SimulatorStateProvider } from "@/contexts/SimulatorStateContext"
import { HelpCenterProvider } from "@/contexts/HelpCenterContext"
import { TutorialProvider } from "@/hooks/use-tutorial"
import { tutorialConfig } from "@/lib/tutorial-data"
import { HelmetProvider } from "react-helmet-async"

export function Providers({ children }) {
  return (
    <HelmetProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <HelpCenterProvider>
            <TutorialProvider config={tutorialConfig} autoStartIntro={false}>
              <WebSocketProvider>
                <SimulatorStateProvider>
                  {children}
                </SimulatorStateProvider>
              </WebSocketProvider>
            </TutorialProvider>
          </HelpCenterProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  )
}
