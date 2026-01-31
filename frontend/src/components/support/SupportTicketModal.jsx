import { useState } from 'react'
import { X, Send, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { auth } from '@/lib/firebase/config'

/**
 * Support Ticket Modal
 * 
 * For authenticated users: Creates support ticket
 * For non-authenticated users: Redirects to /contact page
 */

export function SupportTicketModal({ isOpen, onClose, conversationId, prefilledSubject = '', prefilledContent = '' }) {
  const { user } = useAuth()
  const [subject, setSubject] = useState(prefilledSubject)
  const [content, setContent] = useState(prefilledContent)
  const [category, setCategory] = useState('GENERAL')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  // If not authenticated, show login prompt
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Sign In Required</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-sm text-foreground">
                To create a support ticket, you need to sign in to your account. 
                Alternatively, you can use our contact form.
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => window.location.href = '/login'} 
                className="flex-1"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => window.location.href = '/contact'} 
                variant="outline" 
                className="flex-1"
              >
                Contact Form
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Get auth token
      const token = await auth.currentUser.getIdToken()

      // Call support API
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/v1/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject,
          content,
          category,
          priority: 'MEDIUM',
          conversationId: conversationId || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to create support ticket')
      }

      const data = await response.json()
      console.log('Support ticket created:', data)

      // Show success
      setSuccess(true)
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        // Reset form
        setSubject('')
        setContent('')
        setCategory('GENERAL')
        setSuccess(false)
      }, 2000)

    } catch (err) {
      console.error('Error creating support ticket:', err)
      setError(err.message || 'Failed to create support ticket. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Create Support Ticket</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-green-500" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">Ticket Created!</h4>
            <p className="text-sm text-muted-foreground">
              Our support team will review your request and get back to you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-xs text-muted-foreground">
                📬 Our support team typically responds within 24-48 hours.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <div>
              <Label htmlFor="category" className="text-sm font-medium">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="GENERAL">General Inquiry</option>
                <option value="TECHNICAL">Technical Issue</option>
                <option value="BUG">Bug Report</option>
                <option value="FEATURE">Feature Request</option>
              </select>
            </div>

            <div>
              <Label htmlFor="subject" className="text-sm font-medium">Subject *</Label>
              <Input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="content" className="text-sm font-medium">Description *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Please provide details about your issue or question..."
                required
                rows={6}
                className="mt-1.5 resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                {content.length}/1000 characters
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || !subject.trim() || !content.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
