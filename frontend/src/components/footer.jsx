import { Link } from "react-router-dom"

export function Footer() {
  return (
    <footer className="w-full py-4 px-8 border-t border-border bg-muted/50">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>© 2026 GroundCTRL. All rights reserved.</p>
        <div className="flex gap-6">
          <Link to="/privacy" className="hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-primary transition-colors">
            Terms of Service
          </Link>
          <Link to="/contact" className="hover:text-primary transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  )
}
