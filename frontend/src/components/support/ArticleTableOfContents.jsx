import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { 
  List, 
  Clock, 
  Eye,
  ThumbsUp,
  ArrowLeft,
  Share2,
  Printer
} from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Article Table of Contents Component
 * Shows article navigation, stats, and quick actions
 */
export function ArticleTableOfContents({ article, headings = [], className = "" }) {
  const [activeHeading, setActiveHeading] = useState(null)

  // Track scroll position to highlight active section
  useEffect(() => {
    const handleScroll = () => {
      const headingElements = headings.map(h => 
        document.getElementById(h.id)
      ).filter(Boolean)

      const currentHeading = headingElements.find(el => {
        const rect = el.getBoundingClientRect()
        return rect.top >= 0 && rect.top <= 200
      })

      if (currentHeading) {
        setActiveHeading(currentHeading.id)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [headings])

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <aside className={`w-64 shrink-0 ${className}`}>
      <div className="sticky top-20 space-y-4">
        {/* Back Button */}
        <Link to="/help">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Help Center
          </Button>
        </Link>

        {/* Article Stats */}
        {article && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground text-sm mb-3">Article Info</h3>
            <div className="space-y-2">
              {article.estimatedReadMinutes && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{article.estimatedReadMinutes} min read</span>
                </div>
              )}
              {article.views >= 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{article.views} views</span>
                </div>
              )}
              {article.helpfulCount >= 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{article.helpfulCount} found helpful</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table of Contents */}
        {headings.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <List className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">On This Page</h3>
            </div>
            <nav className="space-y-1">
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                    activeHeading === heading.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  style={{ paddingLeft: `${(heading.level - 1) * 12 + 12}px` }}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-foreground text-sm mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={handleShare}
            >
              <Share2 className="w-3.5 h-3.5 mr-2" />
              Share Article
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={handlePrint}
            >
              <Printer className="w-3.5 h-3.5 mr-2" />
              Print Article
            </Button>
          </div>
        </div>

        {/* Related Topics */}
        {article?.tags && article.tags.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground text-sm mb-3">Related Topics</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.slice(0, 6).map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
