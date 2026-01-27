"use client"

import { Satellite, Target, Clock, TrendingUp } from "lucide-react"

const metrics = [
  {
    label: "Active Satellites",
    value: "1",
    sublabel: "SAT-01 Online",
    icon: Satellite,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "Missions Completed",
    value: "4",
    sublabel: "of 12 available",
    icon: Target,
    color: "text-status-nominal",
    bgColor: "bg-status-nominal/10",
  },
  {
    label: "Training Hours",
    value: "8.5",
    sublabel: "hrs logged",
    icon: Clock,
    color: "text-status-warning",
    bgColor: "bg-status-warning/10",
  },
  {
    label: "Skill Level",
    value: "Intermediate",
    sublabel: "Level 3",
    icon: TrendingUp,
    color: "text-teal",
    bgColor: "bg-teal/10",
  },
]

export function SystemMetrics() {
  return (
    <>
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="bg-card border border-border rounded-lg p-4 flex items-start gap-4"
        >
          <div className={`w-10 h-10 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
            <metric.icon className={`h-5 w-5 ${metric.color}`} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{metric.label}</p>
            <p className="text-2xl font-bold text-foreground">{metric.value}</p>
            <p className="text-xs text-muted-foreground">{metric.sublabel}</p>
          </div>
        </div>
      ))}
    </>
  )
}
