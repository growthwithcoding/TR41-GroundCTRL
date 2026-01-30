/**
 * Admin Route Guard
 * Protects admin-only routes from non-admin access
 */

import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

export function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  console.log('AdminRoute check:', { user, loading, isAdmin: user?.isAdmin })

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verifying credentials...</p>
        </div>
      </div>
    )
  }

  // Not logged in - redirect to sign in
  if (!user) {
    return <Navigate to="/sign-in" replace />
  }

  // Not admin - redirect to dashboard with message
  if (!user.isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  // Authorized - render admin content
  return children
}
