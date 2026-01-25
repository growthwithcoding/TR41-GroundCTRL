"use client"

import { useEffect } from "react"
import { Link } from "react-router-dom"
import { useLocation, useNavigate } from "react-router-dom"
import { Satellite, User, Bell, LogOut, Settings, UserCircle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/hooks/use-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export default function AppHeader({ onAuthViewChange }) {
  const location = useLocation(); const pathname = location.pathname
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  
  // Define nav links based on authentication state
  const navLinks = user
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/missions", label: "Missions" },
        { href: "/simulator", label: "Simulator" },
        { href: "/help", label: "Help" },
      ]
    : [
        { href: "/missions", label: "Missions" },
        { href: "/simulator", label: "Simulator" },
        { href: "/help", label: "Help" },
      ]

  const handleSignOut = async () => {
    await signOut()
    navigate("/")
  }

  // Scroll to top on pathname change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const isActive = (href) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
        <Satellite className="h-5 w-5 text-primary" />
        <span className="text-foreground">GroundCTRL</span>
      </Link>

      {/* Navigation */}
      <nav className="flex items-center gap-6">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className={`text-sm font-medium transition-colors ${
              isActive(link.href)
                ? "text-primary border-b-2 border-primary pb-0.5"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-status-critical rounded-full" />
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Account dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer outline-none">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            {user && (
              <div className="hidden md:flex flex-col items-start">
                <span className="text-xs font-mono text-primary">CTRL-USER</span>
                <span className="text-xs text-muted-foreground">{user.displayName || user.email?.split("@")[0]}</span>
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {user ? (
              <>
                <div className="px-2 py-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">CTRL-USER</span>
                  </div>
                  <p className="font-medium text-foreground mt-1">{user.displayName || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut} className="text-red-500 focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </>
            ) : onAuthViewChange ? (
              <>
                <DropdownMenuItem onSelect={() => onAuthViewChange("login")}>Sign In</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onAuthViewChange("register")}>Register</DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem asChild>
                  <Link to="/">Sign In</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/">Register</Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
