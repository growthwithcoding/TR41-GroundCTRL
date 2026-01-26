"use client"

import { Play, BookOpen, Settings, BarChart3 } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

const actions = [
  {
    label: "Resume Mission",
    description: "Continue Stable Orbit & First Ground Pass",
    icon: Play,
    href: "/simulator",
    variant: "default",
  },
  {
    label: "Training Docs",
    description: "Review satellite operation guides",
    icon: BookOpen,
    href: "#",
    variant: "outline",
  },
  {
    label: "Analytics",
    description: "View your performance metrics",
    icon: BarChart3,
    href: "#",
    variant: "outline",
  },
  {
    label: "Settings",
    description: "Customize your experience",
    icon: Settings,
    href: "#",
    variant: "outline",
  },
]

export function QuickActions() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-3">
        {actions.map((action) => (
          <Link key={action.label} to={action.href}>
            <Button
              variant={action.variant}
              className={`w-full justify-start gap-4 h-auto py-4 px-4 ${
                action.variant === "default" ? "" : "hover:bg-accent"
              }`}
            >
              <action.icon className="w-5 h-5 shrink-0" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium mb-0.5">{action.label}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  )
}
