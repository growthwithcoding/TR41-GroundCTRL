"use client"

import { useState, useEffect } from "react"
import { Satellite, Radio, Zap, Thermometer, Fuel } from "lucide-react"

export function SatelliteOverview() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const subsystems = [
    { name: "Power", value: 92, unit: "%", icon: Zap, status: "nominal" },
    { name: "Thermal", value: 24, unit: "°C", icon: Thermometer, status: "nominal" },
    { name: "Fuel", value: 75, unit: "%", icon: Fuel, status: "nominal" },
    { name: "Comm", value: 98, unit: "%", icon: Radio, status: "nominal" },
  ]

  const orbitData = {
    altitude: "408 km",
    velocity: "7.66 km/s",
    inclination: "51.6°",
    period: "92.68 min",
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Satellite className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">SAT-01 Status</h2>
            <p className="text-xs text-muted-foreground">Low Earth Orbit - ISS Track</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-nominal animate-pulse" />
          <span className="text-xs font-medium text-status-nominal">OPERATIONAL</span>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mission Time */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Mission Time
            </h3>
            <div className="bg-muted/50 rounded-md p-4">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">UTC</p>
              <p className="font-mono text-lg font-semibold text-foreground">
                {currentTime.toISOString().slice(11, 19)}
              </p>
            </div>
          </div>

          {/* Telemetry Data */}
          <div className="space-y-4">
            {/* Orbit Parameters */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Orbit Parameters
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(orbitData).map(([key, value]) => (
                  <div key={key} className="bg-muted/50 rounded-md p-3">
                    <p className="text-[10px] text-muted-foreground uppercase">{key}</p>
                    <p className="font-mono text-sm font-semibold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Subsystem Status */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Subsystem Status
              </h3>
              <div className="space-y-2">
                {subsystems.map((sys) => (
                  <div key={sys.name} className="flex items-center gap-3">
                    <sys.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground w-16">{sys.name}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-status-nominal rounded-full transition-all"
                        style={{ width: `${sys.value}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-semibold text-foreground w-12">
                      {sys.value}{sys.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
