import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import AppHeader from "@/components/app-header"
import { Footer } from "@/components/footer"
import { FloatingNovaChat } from "@/components/nova/FloatingNovaChat"
import { useAuth } from "@/hooks/use-auth"
import {
  ChevronRight,
  ArrowLeft,
  Loader2,
  HelpCircle,
  Rocket,
  Satellite,
  Radio,
  Gauge,
  BookOpen,
  Play,
  Settings,
  MessageSquare,
  Zap,
  Shield,
  Trophy,
  Bot,
  Sparkles,
} from "lucide-react"

import {
  getCategories,
  getArticlesByCategory
} from '@/lib/api/helpService'

// Icon mapping
const iconMap = {
  Rocket,
  Satellite,
  Radio,
  Gauge,
  BookOpen,
  Play,
  Settings,
  HelpCircle,
  MessageSquare,
  Zap,
  Shield,
  Trophy,
  Bot,
  Sparkles,
}

function getIcon(iconName) {
  return iconMap[iconName] || HelpCircle
}

export default function HelpCategoryPage() {
  const { categoryId } = useParams()
  const { user } = useAuth()
  const [category, setCategory] = useState(null)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategoryData() {
      setLoading(true)
      try {
        // Fetch all categories to find the one we need
        const categories = await getCategories()
        const foundCategory = categories.find(
          cat => cat.id === categoryId || cat.code === categoryId
        )
        
        if (foundCategory) {
          setCategory(foundCategory)
          // Fetch all articles for this category
          const categoryArticles = await getArticlesByCategory(foundCategory.id, 100)
          setArticles(categoryArticles)
        }
      } catch (error) {
        console.error('Failed to fetch category data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchCategoryData()
  }, [categoryId])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-semibold text-foreground">🛰️ Loading Category...</p>
            <p className="text-sm text-muted-foreground mt-1">Retrieving articles from database</p>
          </div>
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Category Not Found</h2>
            <p className="text-muted-foreground mb-6">The requested help category doesn't exist.</p>
            <Link
              to="/help"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Help Center
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const Icon = getIcon(category.icon)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <div className="flex-1 flex">
        <main className="flex-1">
          {/* Breadcrumb */}
          <div className="bg-card border-b border-border py-3 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link to="/help" className="hover:text-primary transition-colors">
                  Help Center
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground">{category.name}</span>
              </div>
            </div>
          </div>

          {/* Category Header */}
          <section className="bg-card border-b border-border py-8 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">{category.name}</h1>
                  <p className="text-lg text-muted-foreground mb-4">{category.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{articles.length} article{articles.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Articles List */}
          <section className="py-12 px-6">
            <div className="max-w-6xl mx-auto">
              {articles.length > 0 ? (
                <div className="grid gap-4">
                  {articles.map((article) => (
                    <Link
                      key={article.id}
                      to={`/help/article/${article.slug}`}
                      className="flex items-center justify-between p-6 bg-card border border-border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all group"
                    >
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                          {article.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          {article.difficulty && (
                            <span className="px-2 py-1 bg-muted rounded">
                              {article.difficulty}
                            </span>
                          )}
                          {article.estimatedReadMinutes && (
                            <span>{article.estimatedReadMinutes} min read</span>
                          )}
                          {article.stats?.views > 0 && (
                            <span>{article.stats.views} views</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors ml-4 shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-card border border-dashed border-border rounded-lg p-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">📡 No Articles Available</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-8">
                    This category doesn't have any articles yet. Our Mission Control team is working on creating comprehensive guides for <strong>{category.name}</strong>.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link to="/help">
                      <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Browse All Categories
                      </button>
                    </Link>
                    <Link to="/contact">
                      <button className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors font-medium">
                        <MessageSquare className="w-4 h-4" />
                        Request Content
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      <Footer />
      
      {/* Floating NOVA Chat */}
      <FloatingNovaChat 
        context="help"
        position="left"
      />
    </div>
  )
}
