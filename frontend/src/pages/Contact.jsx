import { useState } from "react"
import AppHeader from "@/components/app-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, MessageSquare, HelpCircle, Bug, Lightbulb, Building } from "lucide-react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: ""
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
  }

  const categories = [
    { id: "general", label: "General Inquiry", icon: MessageSquare },
    { id: "support", label: "Technical Support", icon: HelpCircle },
    { id: "bug", label: "Bug Report", icon: Bug },
    { id: "feature", label: "Feature Request", icon: Lightbulb },
    { id: "enterprise", label: "Enterprise/Education", icon: Building },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      
      <main className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Contact Us</h1>
            <p className="text-muted-foreground">Have a question or feedback? We'd love to hear from you.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Contact Info Sidebar */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Email Us</h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  support@groundctrl.space
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Response time: 24-48 hours
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Support</h2>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  For urgent technical issues, please include "URGENT" in your subject line.
                </p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-foreground mb-2">Enterprise Solutions</h2>
                <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                  Looking to deploy GroundCTRL for your educational institution, aerospace company, or training program?
                </p>
                <Button variant="outline" className="w-full bg-transparent border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Learn More
                </Button>
              </div>
            </div>

            {/* Contact Form */}
            <div className="md:col-span-2">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">Send us a Message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Category</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat.id })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                            formData.category === cat.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                          }`}
                        >
                          <cat.icon className="w-4 h-4" />
                          <span className="truncate">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name and Email */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Name</label>
                      <Input
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-muted/50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Email</label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-muted/50"
                        required
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Subject</label>
                    <Input
                      placeholder="Brief description of your inquiry"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="bg-muted/50"
                      required
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Message</label>
                    <textarea
                      placeholder="Please provide as much detail as possible..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full min-h-[150px] px-3 py-2 rounded-lg border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                      required
                    />
                  </div>

                  {/* Submit */}
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
