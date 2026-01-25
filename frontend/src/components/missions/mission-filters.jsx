"use client"

import { Search, Filter, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

const categories = ["All Missions", "Fundamentals", "Orbital Mechanics", "Communications", "Power Systems", "Advanced"]

export function MissionFilters({
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  isLoggedOut = false,
}) {
  return (
    <div className="space-y-3">
      {/* Soft gating copy for logged-out users */}
      {isLoggedOut && (
        <div className="text-xs text-muted-foreground text-center py-2 px-4 bg-primary/5 border border-primary/20 rounded-lg">
          Sign in to track your progress and unlock advanced missions
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Category tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeCategory === category
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Search and filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search missions..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="bg-transparent">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onSortChange("default")}
                className={sortBy === "default" ? "bg-muted" : ""}
              >
                Default Order
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onSortChange("difficulty-asc")}
                className={sortBy === "difficulty-asc" ? "bg-muted" : ""}
              >
                Difficulty (Low to High)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onSortChange("difficulty-desc")}
                className={sortBy === "difficulty-desc" ? "bg-muted" : ""}
              >
                Difficulty (High to Low)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onSortChange("duration-asc")}
                className={sortBy === "duration-asc" ? "bg-muted" : ""}
              >
                Duration (Short to Long)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onSortChange("duration-desc")}
                className={sortBy === "duration-desc" ? "bg-muted" : ""}
              >
                Duration (Long to Short)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onSortChange("mp-desc")}
                className={sortBy === "mp-desc" ? "bg-muted" : ""}
              >
                Mission Points (High to Low)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
