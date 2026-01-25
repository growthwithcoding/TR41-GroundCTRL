import { useParams, Link } from "react-router-dom"
import AppHeader from "@/components/app-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function HelpArticlePage() {
  const { slug } = useParams()
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      
      <main className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Link to="/help">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Help Center
            </Button>
          </Link>
          
          <div className="bg-card border border-border rounded-lg p-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Help Article
            </h1>
            <p className="text-muted-foreground">
              Article slug: {slug}
            </p>
            <p className="text-muted-foreground mt-4">
              This page is under construction. Please check back later for detailed help articles.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
