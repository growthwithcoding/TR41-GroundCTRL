import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import AppHeader from "@/components/app-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Clock, 
  Eye, 
  ThumbsUp, 
  ThumbsDown,
  Loader2, 
  AlertCircle,
  BookOpen,
  Calendar,
  Tag,
  Sparkles,
  CheckCircle2
} from "lucide-react"
import { getArticleBySlug } from "@/lib/api/helpService"
import { cn } from "@/lib/utils"

// Background Stars Component
function StarField() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Small stars */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(1px 1px at 20px 30px, hsl(var(--muted-foreground)), transparent),
            radial-gradient(1px 1px at 60px 70px, hsl(var(--muted-foreground)), transparent),
            radial-gradient(1px 1px at 50px 120px, hsl(var(--muted-foreground)), transparent),
            radial-gradient(1px 1px at 120px 40px, hsl(var(--muted-foreground)), transparent),
            radial-gradient(1px 1px at 150px 90px, hsl(var(--muted-foreground)), transparent)`,
          backgroundSize: '200px 200px',
          animation: 'twinkle 4s ease-in-out infinite'
        }}
      />
    </div>
  )
}

/**
 * Render article content blocks
 */
function renderContentBlock(block, index) {
  switch (block.type) {
    case 'HEADING':
      return (
        <h2 key={index} className="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          {block.content}
        </h2>
      )
    
    case 'PARAGRAPH':
      return (
        <p key={index} className="text-muted-foreground leading-relaxed mb-4 text-base">
          {block.content}
        </p>
      )
    
    case 'CODE':
      return (
        <pre key={index} className="bg-muted/50 border border-border p-4 rounded-lg overflow-x-auto mb-4 font-mono text-sm">
          <code className="text-foreground">{block.content}</code>
        </pre>
      )
    
    case 'LIST':
      return (
        <ul key={index} className="space-y-2 mb-4 ml-4">
          {block.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary mt-1 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    
    case 'CALLOUT':
      return (
        <div key={index} className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg mb-6">
          <p className="text-foreground font-medium flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            {block.content}
          </p>
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
  const [feedback, setFeedback] = useState(null) // 'helpful' or 'not_helpful'
  const [showContent, setShowContent] = useState(false)
  
  useEffect(() => {
    async function fetchArticle() {
      setLoading(true)
      setError(null)
      
      try {
        const data = await getArticleBySlug(slug)
        if (data && data.article) {
          setArticle(data.article)
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
  
  // Trigger entrance animation
  useEffect(() => {
    if (article) {
      setTimeout(() => setShowContent(true), 100)
    }
  }, [article])
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch {
      return 'Unknown'
    }
  }
  
  const handleFeedback = (isHelpful) => {
    setFeedback(isHelpful ? 'helpful' : 'not_helpful')
    // TODO: Send feedback to backend
    console.log(`User found article ${isHelpful ? 'helpful' : 'not helpful'}`)
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StarField />
      <AppHeader />
      
      <main className="flex-1 py-8 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <Link to="/help">
            <Button variant="ghost" className="mb-6 group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Help Center
            </Button>
          </Link>
          
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-semibold text-foreground">📡 Retrieving Article...</p>
              <p className="text-sm text-muted-foreground mt-1">Loading knowledge base data</p>
            </div>
          )}
          
          {/* Error State */}
          {error && !loading && (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
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
            <div className="space-y-6">
              {/* Article Header Card */}
              <article className={cn(
                "bg-card border border-border rounded-lg p-8 transition-all duration-700",
                showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}>
                <header className="mb-8 pb-6 border-b border-border">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h1 className="text-4xl font-bold text-foreground mb-3">
                        {article.title}
                      </h1>
                      
                      {article.excerpt && (
                        <p className="text-lg text-muted-foreground">
                          {article.excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Article Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {/* Read Time */}
                    {article.estimatedReadMinutes && (
                      <div className="bg-background border border-border rounded-lg p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs font-medium uppercase tracking-wide">
                            Read Time
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                          {article.estimatedReadMinutes}m
                        </div>
                      </div>
                    )}
                    
                    {/* Views */}
                    <div className="bg-background border border-border rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">
                          Views
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {article.views || 0}
                      </div>
                    </div>
                    
                    {/* Helpful Count */}
                    <div className="bg-background border border-border rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">
                          Helpful
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-green-500">
                        {article.helpfulCount || 0}
                      </div>
                    </div>
                    
                    {/* Difficulty */}
                    {article.difficulty && (
                      <div className="bg-background border border-border rounded-lg p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-xs font-medium uppercase tracking-wide">
                            Level
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-sm font-semibold">
                          {article.difficulty}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-muted-foreground">
                    {article.createdAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Published {formatDate(article.createdAt)}</span>
                      </div>
                    )}
                    
                    {article.updatedAt && article.updatedAt !== article.createdAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Updated {formatDate(article.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      {article.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </header>
                
                {/* Article Body */}
                <div className="prose prose-slate max-w-none">
                  {article.content && Array.isArray(article.content) ? (
                    article.content.map((block, index) => renderContentBlock(block, index))
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">
                      {article.plainTextContent || article.content || 'No content available'}
                    </p>
                  )}
                </div>
              </article>
              
              {/* Feedback Card */}
              <div className={cn(
                "bg-card border border-border rounded-lg p-6 transition-all duration-700 delay-300",
                showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-foreground mb-1">
                      Was this article helpful?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Your feedback helps us improve our knowledge base
                    </p>
                  </div>
                  
                  {feedback ? (
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Thanks for your feedback!</span>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={() => handleFeedback(true)}
                        className="group"
                      >
                        <ThumbsUp className="w-5 h-5 mr-2 group-hover:text-green-500 transition-colors" />
                        Yes, helpful
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={() => handleFeedback(false)}
                        className="group"
                      >
                        <ThumbsDown className="w-5 h-5 mr-2 group-hover:text-orange-500 transition-colors" />
                        Not helpful
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Back to Help Center */}
              <div className={cn(
                "text-center transition-all duration-700 delay-500",
                showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}>
                <Link to="/help">
                  <Button variant="ghost" size="lg">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Browse More Articles
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
