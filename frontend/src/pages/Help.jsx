import { useState, useMemo, useId } from "react"
import { Link } from "react-router-dom"
import AppHeader from "@/components/app-header"
import { Footer } from "@/components/footer"
import { NovaChat } from "@/components/nova-chat"
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
} from "lucide-react"

import {
  getPublishedCategories,
  getPublishedFaqs,
  getPopularArticles,
  getArticlesByCategory,
  searchArticles
} from '@/lib/help-data'

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
  const sessionId = useId()
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [expandedCategory, setExpandedCategory] = useState("cat_001")

  // Fetch data (simulated - would be from Firestore in production)
  const categories = getPublishedCategories()
  const faqs = getPublishedFaqs()
  const popularArticles = getPopularArticles()

  // Search functionality
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return []
    return searchArticles(searchQuery)
  }, [searchQuery])

  const isSearching = searchQuery.length >= 2

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <div className="flex-1 flex">
        {/* Nova Chat Sidebar - Fixed to take full column height */}
        <NovaChat sessionId={`help-${sessionId}`} context="help" className="hidden lg:flex h-[calc(100vh-4rem)] sticky top-16" />

        <main className="flex-1">
          {/* Hero Section - Compact Single Row */}
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
                    {searchResults.length > 0 ? (
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

          {/* Popular Articles */}
          {!isSearching && (
            <section className="py-8 px-6 border-b border-border">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Popular Articles
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {popularArticles.map((article) => {
                    const Icon = getIcon(article.icon)
                    return (
                      <Link
                        key={article.id}
                        to={`/help/article/${article.title.toLowerCase().replace(/\s+/g, "-")}`}
                        className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{article.title}</p>
                          <p className="text-xs text-muted-foreground">{article.categoryName}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </section>
          )}

          <div className="max-w-6xl mx-auto py-12 px-6">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Categories */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-semibold text-foreground">Browse by Category</h2>

                <div className="space-y-4">
                  {categories.map((category) => {
                    const Icon = getIcon(category.icon)
                    const articles = getArticlesByCategory(category.id)

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
                          <div
                            className={`w-12 h-12 rounded-lg ${category.bgColor} flex items-center justify-center shrink-0`}
                          >
                            <Icon className={`w-6 h-6 ${category.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground">{category.title}</h3>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {category.articleCount} articles
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
                            <ul className="divide-y divide-border">
                              {articles.map((article) => (
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
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* FAQs Sidebar */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-foreground">Frequently Asked Questions</h2>

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
        </main>
      </div>

      <Footer />
    </div>
  )
}
