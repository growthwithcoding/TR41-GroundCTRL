import { useState, useEffect, useMemo, useId } from "react"
import { Link } from "react-router-dom"
import AppHeader from "@/components/app-header"
import { Footer } from "@/components/footer"
import { NovaAssistant } from "@/components/nova/NovaAssistant"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Rocket,
  Satellite,
  Radio,
  Gauge,
  BookOpen,
  Play,
  Settings,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Zap,
  Shield,
  Trophy,
  Bot,
  Sparkles,
  Loader2,
} from "lucide-react"

import {
  getCategories,
  getFaqs,
  getPopularArticles,
  getArticlesByCategory,
  searchHelp
} from '@/lib/api/helpService'

// Icon mapping for dynamic rendering from Firestore string values
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

export default function HelpPage() {
  const { user } = useAuth()
  const sessionId = useId()
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [expandedCategory, setExpandedCategory] = useState(null)

  // State for fetched data
  const [categories, setCategories] = useState([])
  const [faqs, setFaqs] = useState([])
  const [popularArticles, setPopularArticles] = useState([])
  const [categoryArticles, setCategoryArticles] = useState({})
  const [articleCounts, setArticleCounts] = useState({}) // Track counts per category
  const [loading, setLoading] = useState(true)
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  // Fetch initial data on mount
  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true)
      try {
        const [categoriesData, faqsData, popularData] = await Promise.all([
          getCategories(),
          getFaqs(),
          getPopularArticles(4)
        ])
        
        setCategories(categoriesData)
        setFaqs(faqsData)
        setPopularArticles(popularData)
        
        // Fetch article counts for all categories
        const counts = {}
        await Promise.all(
          categoriesData.map(async (category) => {
            const articles = await getArticlesByCategory(category.id)
            counts[category.id] = articles.length
          })
        )
        setArticleCounts(counts)
        
        // Don't auto-expand any category on load
      } catch (error) {
        console.error('Failed to fetch help data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchInitialData()
  }, [])

  // Fetch articles for a category when expanded
  useEffect(() => {
    async function fetchCategoryArticles() {
      if (!expandedCategory || categoryArticles[expandedCategory]) return
      
      try {
        const articles = await getArticlesByCategory(expandedCategory)
        setCategoryArticles(prev => ({
          ...prev,
          [expandedCategory]: articles
        }))
      } catch (error) {
        console.error('Failed to fetch category articles:', error)
      }
    }
    
    fetchCategoryArticles()
  }, [expandedCategory, categoryArticles])

  // Search functionality with debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const results = await searchHelp(searchQuery)
        setSearchResults(results.articles || [])
      } catch (error) {
        console.error('Search failed:', error)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300) // Debounce 300ms

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const isSearching = searchQuery.length >= 2

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <div className="flex-1 flex">
        {/* Nova Assistant Sidebar - Unified component with auth detection */}
        <NovaAssistant 
          context="help" 
          showAuthPrompt={!user}
          className="hidden lg:flex h-[calc(100vh-4rem)] sticky top-16" 
        />

        <main className="flex-1">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-semibold text-foreground">🚀 Establishing Uplink...</p>
              <p className="text-sm text-muted-foreground mt-1">Mission Control is preparing your help center</p>
            </div>
          )}

          {/* Hero Section - Compact Single Row */}
          {!loading && (
            <section className="bg-card border-b border-border py-4 px-6">
            <div className="max-w-6xl mx-auto flex items-center gap-6">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Help Center</h1>
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    Find answers and learn satellite operations
                  </p>
                </div>
              </div>

              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 text-sm bg-background"
                />
                {/* Search Results Dropdown */}
                {isSearching && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50">
                    {searchLoading ? (
                      <div className="bg-card border border-border rounded-lg p-3 text-center shadow-lg">
                        <Loader2 className="w-4 h-4 animate-spin text-primary inline-block mr-2" />
                        <span className="text-sm text-muted-foreground">Searching...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
                        <div className="px-3 py-1.5 bg-muted/50 border-b border-border">
                          <span className="text-xs text-muted-foreground">
                            Found {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <ul className="max-h-64 overflow-y-auto">
                          {searchResults.map((article) => (
                            <li key={article.id}>
                              <Link
                                to={`/help/article/${article.slug}`}
                                className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
                              >
                                <span className="text-sm text-foreground">{article.title}</span>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="bg-card border border-border rounded-lg p-3 text-center shadow-lg">
                        <p className="text-sm text-muted-foreground">
                          No articles found for "{searchQuery}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
          )}

          {/* Popular Articles */}
          {!loading && !isSearching && (
            <section className="py-8 px-6 border-b border-border">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Popular Articles
                </h2>
                {popularArticles.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {popularArticles.map((article) => {
                      const Icon = getIcon(article.icon || 'HelpCircle')
                      return (
                        <Link
                          key={article.id}
                          to={`/help/article/${article.slug}`}
                          className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{article.title}</p>
                            <p className="text-xs text-muted-foreground">{article.excerpt}</p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <div className="bg-card border border-dashed border-border rounded-lg p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Rocket className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">🌌 No Popular Articles Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Our mission logs are still being compiled. Check back soon as our most viewed articles will appear here!
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {!loading && (
            <div className="max-w-6xl mx-auto py-12 px-6">
              <div className="grid lg:grid-cols-3 gap-12">
                {/* Categories */}
                <div className="lg:col-span-2 space-y-6">
                  <h2 className="text-xl font-semibold text-foreground">Browse by Category</h2>

                  {categories.length > 0 ? (
                    <div className="space-y-4">
                      {categories.map((category) => {
                      const Icon = getIcon(category.icon)
                      const articles = categoryArticles[category.id] || []

                      return (
                        <div
                          key={category.id}
                          className="bg-card border border-border rounded-lg overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCategory(
                                expandedCategory === category.id ? null : category.id
                              )
                            }
                            className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
                          >
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground">{category.name}</h3>
                              <p className="text-sm text-muted-foreground">{category.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {articleCounts[category.id] || 0} articles
                              </span>
                              <ChevronDown
                                className={`w-5 h-5 text-muted-foreground transition-transform ${
                                  expandedCategory === category.id ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </button>

                          {expandedCategory === category.id && (
                            <div className="border-t border-border bg-muted/30">
                              {articles.length > 0 ? (
                                <>
                                  <ul className="divide-y divide-border">
                                    {articles.slice(0, 7).map((article) => (
                                      <li key={article.id}>
                                        <Link
                                          to={`/help/article/${article.slug}`}
                                          className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                                        >
                                          <span className="text-sm text-foreground">{article.title}</span>
                                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                  {articles.length > 7 && (
                                    <div className="px-4 py-3 border-t border-border">
                                      <Link
                                        to={`/help/category/${category.code || category.id}`}
                                        className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                                      >
                                        <span>View all {articles.length} articles in {category.name}</span>
                                        <ChevronRight className="w-4 h-4" />
                                      </Link>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="px-4 py-8 text-center">
                                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                                    <HelpCircle className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                  <p className="text-sm font-medium text-foreground mb-1">📡 No Articles Yet</p>
                                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                    This category is awaiting content. Check back soon for helpful guides!
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    </div>
                  ) : (
                    <div className="bg-card border border-dashed border-border rounded-lg p-12 text-center">
                      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">🚀 Mission Database Initializing</h3>
                      <p className="text-muted-foreground max-w-lg mx-auto mb-6">
                        Our help center categories are currently being loaded into the system. Mission Control is preparing comprehensive guides for satellite operations.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Stand by for content upload...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* FAQs Sidebar */}
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-foreground">Frequently Asked Questions</h2>

                  {faqs.length > 0 ? (
                    <div className="space-y-3">
                      {faqs.map((faq, index) => (
                      <div
                        key={faq.id}
                        className="bg-card border border-border rounded-lg overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                          className="w-full flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
                        >
                          <ChevronRight
                            className={`w-4 h-4 text-muted-foreground mt-0.5 shrink-0 transition-transform ${
                              expandedFaq === index ? "rotate-90" : ""
                            }`}
                          />
                          <span className="text-sm font-medium text-foreground">{faq.question}</span>
                        </button>

                        {expandedFaq === index && (
                          <div className="px-4 pb-4 pl-11">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    </div>
                  ) : (
                    <div className="bg-card border border-dashed border-border rounded-lg p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                        <MessageSquare className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">💬 FAQs Incoming</h3>
                      <p className="text-xs text-muted-foreground">
                        Frequently asked questions will be available soon!
                      </p>
                    </div>
                  )}

                  {/* Contact Card */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Still need help?</h3>
                      <p className="text-sm text-muted-foreground">Our team is here for you</p>
                    </div>
                  </div>
                  <Link to="/contact">
                    <Button className="w-full">Contact Support</Button>
                  </Link>
                  </div>

                  {/* Resources Card */}
                  <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-semibold text-foreground mb-4">Additional Resources</h3>
                  <ul className="space-y-3">
                    <li>
                      <Link
                        to="/missions"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <BookOpen className="w-4 h-4" />
                        Mission Library
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/simulator"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        Launch Simulator
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/terms"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        Terms of Service
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/privacy"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        Privacy Policy
                      </Link>
                    </li>
                  </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  )
}
