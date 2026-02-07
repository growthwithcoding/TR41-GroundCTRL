import { Link } from "react-router-dom"
import { 
  BookOpen, 
  Rocket, 
  Zap, 
  TrendingUp, 
  Clock,
  ChevronRight,
  Sparkles
} from "lucide-react"

/**
 * Help Sidebar Component
 * Shows quick navigation, trending topics, and recent articles
 */
export function HelpSidebar({ categories = [], recentArticles = [], className = "" }) {
  return (
    <aside className={`w-64 shrink-0 ${className}`}>
      <div className="sticky top-20 space-y-6">
        {/* Quick Navigation */}
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="w-3.5 h-3.5 text-primary" />
            <h3 className="font-semibold text-foreground text-xs">Quick Navigation</h3>
          </div>
          <nav className="space-y-0.5">
            <Link 
              to="/help"
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <BookOpen className="w-3 h-3" />
              <span>All Categories</span>
            </Link>
            <Link 
              to="/help#popular"
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <TrendingUp className="w-3 h-3" />
              <span>Popular Articles</span>
            </Link>
            <Link 
              to="/help#faq"
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>FAQs</span>
            </Link>
          </nav>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <h3 className="font-semibold text-foreground text-xs">Browse Categories</h3>
            </div>
            <nav className="space-y-0.5">
              {categories.slice(0, 4).map((category) => (
                <Link 
                  key={category.id}
                  to={`/help/category/${category.code || category.id}`}
                  className="flex items-center justify-between px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors group"
                >
                  <span className="truncate">{category.name}</span>
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </nav>
            {categories.length > 6 && (
              <Link 
                to="/help"
                className="block mt-3 pt-3 border-t border-border text-xs text-primary hover:text-primary/80 text-center font-medium"
              >
                View all {categories.length} categories →
              </Link>
            )}
          </div>
        )}

        {/* Recent Articles */}
        {recentArticles.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <h3 className="font-semibold text-foreground text-xs">Recently Updated</h3>
            </div>
            <div className="space-y-0.5">
              {recentArticles.slice(0, 3).map((article) => (
                <Link 
                  key={article.id}
                  to={`/help/article/${article.slug}`}
                  className="block px-2 py-1.5 rounded-md hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-foreground font-medium truncate group-hover:text-primary transition-colors flex-1">
                      {article.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                      {article.estimatedReadMinutes || 5}m
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Help Tip */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">
                💡 Pro Tip
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use the search bar to quickly find articles, or chat with NOVA for instant help!
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
