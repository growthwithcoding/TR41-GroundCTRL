import { Link } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>404 - Page Not Found - GroundCTRL</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 px-4">
          <div className="space-y-2">
            <h1 className="text-9xl font-bold text-primary">404</h1>
            <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              The page you're looking for doesn't exist or h moved.
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/help">
                <Search className="mr-2 h-4 w-4" />
                Get Help
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
