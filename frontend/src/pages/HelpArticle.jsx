import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import AppHeader from "@/components/app-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, Eye, ThumbsUp, Loader2, AlertCircle } from "lucide-react"
import { getArticleBySlug } from "@/lib/api/helpService"

/**
 * Render article content blocks
 */
function renderContentBlock(block, index) {
  switch (block.type) {
    case 'HEADING':
      return (
        <h2 key={index} className="text-2xl font-semibold text-foreground mt-8 mb-4">
          {block.content}
        </h2>
      )
    
    case 'PARAGRAPH':
      return (
        <p key={index} className="text-muted-foreground leading-relaxed mb-4">
          {block.content}
        </p>
      )
    
    case 'CODE':
      return (
        <pre key={index} className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
          <code className="text-sm font-mono">{block.content}</code>
        </pre>
      )
    
    case 'LIST':
      return (
        <ul key={index} className="list-disc list-inside space-y-2 mb-4 text-muted-foreground">
          {block.items?.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )
    
    case 'CALLOUT':
      return (
        <div key={index} className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg mb-4">
          <p className="text-foreground font-medium">{block.content}</p>
        </div>
      )
    
    default:
      return (
        <p key={index} className="text-muted-foreground mb-4">
          {block.content}
        </p>
      )
  }
}

export default function HelpArticlePage() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    async function fetchArticle() {
      setLoading(true)
      setError(null)
      
      try {
        const data = await getArticleBySlug(slug)
        if (data) {
          setArticle(data)
        } else {
          setError('Article not found')
        }
      } catch (err) {
        console.error('Failed to fetch article:', err)
        setError('Failed to load article')
      } finally {
        setLoading(false)
      }
    }
    
    fetchArticle()
  }, [slug])
  
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
          
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          
          {/* Error State */}
          {error && !loading && (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {error}
              </h1>
              <p className="text-muted-foreground mb-6">
                The article you're looking for doesn't exist or has been removed.
              </p>
              <Link to="/help">
                <Button>Browse Help Center</Button>
              </Link>
            </div>
          )}
          
          {/* Article Content */}
          {article && !loading && (
            <article className="bg-card border border-border rounded-lg p-8">
              {/* Article Header */}
              <header className="mb-8 pb-6 border-b border-border">
                <h1 className="text-3xl font-bold text-foreground mb-3">
                  {article.title}
                </h1>
                
                {article.excerpt && (
                  <p className="text-lg text-muted-foreground mb-4">
                    {article.excerpt}
                  </p>
                )}
                
                {/* Article Meta */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {article.estimatedReadMinutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{article.estimatedReadMinutes} min read</span>
                    </div>
                  )}
                  
                  {article.stats?.views !== undefined && (
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{article.stats.views} views</span>
                    </div>
                  )}
                  
                  {article.stats?.helpfulCount !== undefined && (
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{article.stats.helpfulCount} helpful</span>
                    </div>
                  )}
                  
                  {article.difficulty && (
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium uppercase">
                      {article.difficulty}
                    </span>
                  )}
                </div>
                
                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {article.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </header>
              
              {/* Article Body */}
              <div className="prose prose-slate max-w-none">
                {article.content && Array.isArray(article.content) ? (
                  article.content.map((block, index) => renderContentBlock(block, index))
                ) : (
                  <p className="text-muted-foreground">
                    {article.plainTextContent || 'No content available'}
                  </p>
                )}
              </div>
              
              {/* Article Footer */}
              <footer className="mt-12 pt-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Was this article helpful?
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Yes
                    </Button>
                    <Button variant="outline" size="sm">
                      No
                    </Button>
                  </div>
                </div>
              </footer>
            </article>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
