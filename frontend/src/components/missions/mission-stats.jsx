"use client"

import { Trophy } from "lucide-react"

export function MissionStats({ stats }) {
  return (
    <div className="flex items-center gap-6">
      <div className="text-right">
        <p className="text-2xl font-bold text-foreground">
          {stats.completed}<span className="text-muted-foreground">/{stats.total}</span>
        </p>
        <p className="text-xs text-muted-foreground">Completed</p>
      </div>
      <div className="w-px h-10 bg-border" />
      <div className="text-right">
        <p className="text-2xl font-bold text-status-warning">{stats.inProgress}</p>
        <p className="text-xs text-muted-foreground">In Progress</p>
      </div>
      <div className="w-px h-10 bg-border" />
      <div className="text-right">
        <p className="text-2xl font-bold text-primary">{stats.available}</p>
        <p className="text-xs text-muted-foreground">Available</p>
      </div>
      <div className="w-px h-10 bg-border" />
      <div className="text-right flex items-center gap-2">
        <Trophy className="w-5 h-5 text-gold" />
        <div>
          <p className="text-2xl font-bold text-foreground">{stats.totalMp.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total MP</p>
        </div>
      </div>
    </div>
  )
}
