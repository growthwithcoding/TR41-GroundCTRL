import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import AppHeader from "@/components/app-header"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, User, Mail, Shield, Trash2, Satellite, Award, Clock, Rocket } from "lucide-react"
import { Footer } from "@/components/footer"
import { sendPasswordResetEmail } from "firebase/auth"
// Add API call helper for profile update

async function updateUserProfile(userId, data) {
  const res = await fetch(`/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update profile")
  return res.json()
}

// Add API call helper for account deletion
async function deleteUserAccount(userId) {
  const res = await fetch(`/users/${userId}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok) throw new Error("Failed to delete account on backend")
  return res.json()
}


export default function AccountPage() {
  // Password reset state
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetError, setResetError] = useState("")
  const navigate = useNavigate()
  const { user, loading, signOut } = useAuth()
  
  const [displayName, setDisplayName] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleteError, setDeleteError] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      navigate("/")
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName)
    }
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    try {
      // PATCH to backend instead of Firebase
      const updated = await updateUserProfile(user.uid, { displayName })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      // Optionally update local user state here if needed
    } catch (error) {
      console.error("Error updating profile:", error)
    }
    setSaving(false)
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return
    setResetLoading(true)
    setResetError("")
    setResetSuccess(false)
    try {
      await sendPasswordResetEmail(user.auth || user, user.email)
      setResetSuccess(true)
    } catch (err) {
      setResetError(err?.message || "Failed to send reset email.")
    }
    setResetLoading(false)
  }

  const handleDeleteAccount = async () => {
    setDeleteError("")
    if (deleteConfirm !== "DELETE") {
      setDeleteError("You must type DELETE to confirm account deletion.")
      return
    }
    if (confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.")) {
      try {
        // Call backend delete endpoint first
        await deleteUserAccount(user.uid)
        // Then sign out and navigate away (or call Firebase delete if required)
        await signOut()
        navigate("/")
      } catch (err) {
        setDeleteError(err.message || "Failed to delete account.")
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <Helmet>
        <title>Account - GroundCTRL</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header with status */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary text-xs font-mono tracking-wider mb-1">
                <Satellite className="h-3 w-3" />
                OPERATOR PROFILE
              </div>
              <h1 className="text-2xl font-bold text-foreground">Mission Control Account</h1>
              <p className="text-muted-foreground">Manage your operator credentials and preferences</p>
            </div>
          </div>

          {/* Account Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Account Information
              </CardTitle>
              <CardDescription>Your operator profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">DISPLAY NAME</div>
                  <div className="font-medium text-foreground">{user.displayName || "Not set"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">EMAIL</div>
                  <div className="font-medium text-foreground">{user.email}</div>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-1">OPERATOR ID</div>
                  <div className="font-mono text-sm text-foreground">{user.uid}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Edit Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Operator Details
              </CardTitle>
              <CardDescription>Update your display name and callsign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium text-foreground">
                  Display Name
                </label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saved ? "Saved" : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          {/* Email Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email
              </CardTitle>
              <CardDescription>Your email address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <Input value={user.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Contact support to change your email address
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>Manage your security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Password</p>
                  <p className="text-sm text-muted-foreground">Last changed: Never</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button variant="outline" onClick={handlePasswordReset} disabled={resetLoading || resetSuccess}>
                    {resetLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {resetSuccess ? "Email Sent!" : "Change Password"}
                  </Button>
                  {resetError && (
                    <span className="text-xs text-red-500 mt-1">{resetError}</span>
                  )}
                  {resetSuccess && (
                    <span className="text-xs text-green-600 mt-1">Check your email for a reset link.</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between opacity-60 pointer-events-none">
                <div>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    Two-Factor Authentication
                    <span className="ml-2 px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground border border-border">Coming Soon</span>
                  </p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button variant="outline" disabled title="Feature coming soon">
                  Enable
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-500">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button variant="destructive" onClick={handleDeleteAccount}>
                    Delete Account
                  </Button>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <label htmlFor="deleteConfirm" className="text-xs text-muted-foreground">
                    Type <span className="font-bold text-red-500">DELETE</span> to confirm:
                  </label>
                  <Input
                    id="deleteConfirm"
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    className="max-w-xs"
                  />
                  {deleteError && <span className="text-xs text-red-500">{deleteError}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
    </>
  )
}
