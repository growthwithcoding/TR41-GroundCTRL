"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"
import { WebSocketProvider } from "@/contexts/WebSocketContext"
import { SimulatorStateProvider } from "@/contexts/SimulatorStateContext"
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
          <WebSocketProvider>
            <SimulatorStateProvider>
              {children}
            </SimulatorStateProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  )
}
