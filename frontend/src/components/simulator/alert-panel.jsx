"use client"

import { useSimulatorState } from "@/contexts/SimulatorStateContext"
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react"

/**
 * AlertPanel Component
 * 
 * Displays system alerts and notifications from the simulator state.
 * Alerts can be acknowledged by clicking the X button.
 * Only unacknowledged alerts are shown.
 */
export function AlertPanel() {
  const { alerts, acknowledgeAlert } = useSimulatorState()
  
  // Filter for unacknowledged alerts only
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged)
  
  // Don't render if no alerts
  if (unacknowledgedAlerts.length === 0) return null
  
  return (
    <div className="fixed top-20 right-4 w-96 space-y-2 z-50">
      {unacknowledgedAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-lg border shadow-lg animate-in slide-in-from-right ${
            alert.severity === 'critical' 
              ? 'bg-destructive/10 border-destructive' 
              : alert.severity === 'warning'
                ? 'bg-yellow-500/10 border-yellow-500'
                : 'bg-blue-500/10 border-blue-500'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {alert.severity === 'critical' && (
                <AlertCircle className="w-5 h-5 text-destructive" />
              )}
              {alert.severity === 'warning' && (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
              {alert.severity === 'info' && (
                <Info className="w-5 h-5 text-blue-500" />
              )}
              {alert.severity === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-status-nominal" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">
                {alert.subsystem || 'System Alert'}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {alert.message}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => acknowledgeAlert(alert.id)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Acknowledge alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
