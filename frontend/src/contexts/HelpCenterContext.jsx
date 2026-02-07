import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getCategories,
  getFaqs,
  getPopularArticles,
  getArticlesByCategory,
} from '@/lib/api/helpService'

const HelpCenterContext = createContext(null)

const CACHE_KEY = 'help_center_cache'
const CACHE_TTL = 1000 * 60 * 60 * 2 // 2 hours

/**
 * HelpCenterProvider - Provides cached help center data
 * Reduces API calls by caching categories, articles, and FAQs
 */
export function HelpCenterProvider({ children }) {
  const [categories, setCategories] = useState([])
  const [allArticles, setAllArticles] = useState({}) // categoryId -> articles[]
  const [faqs, setFaqs] = useState([])
  const [popularArticles, setPopularArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastFetch, setLastFetch] = useState(null)

  // Load from cache on mount
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached)
        const age = Date.now() - timestamp
        
        // Use cache if less than TTL
        if (age < CACHE_TTL) {
          console.log('📦 Loading help center from cache (age:', Math.round(age / 1000 / 60), 'min)')
          setCategories(data.categories || [])
          setAllArticles(data.allArticles || {})
          setFaqs(data.faqs || [])
          setPopularArticles(data.popularArticles || [])
          setLastFetch(timestamp)
          setLoading(false)
          return
        } else {
          console.log('⏰ Cache expired, fetching fresh data')
          localStorage.removeItem(CACHE_KEY)
        }
      } catch (err) {
        console.warn('Failed to parse cache:', err)
        localStorage.removeItem(CACHE_KEY)
      }
    }
    
    // No valid cache, fetch fresh data
    fetchAllData()
  }, [])

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Fetching help center data...')
      
      // Fetch base data in parallel
      const [categoriesData, faqsData, popularData] = await Promise.all([
        getCategories(),
        getFaqs(),
        getPopularArticles(4)
      ])
      
      console.log(`✅ Fetched: ${categoriesData.length} categories, ${faqsData.length} FAQs, ${popularData.length} popular articles`)
      
      // Fetch ALL articles for ALL categories in one go (this replaces the per-category fetching)
      const articlesMap = {}
      await Promise.all(
        categoriesData.map(async (category) => {
          try {
            const articles = await getArticlesByCategory(category.id)
            articlesMap[category.id] = articles
          } catch (err) {
            console.warn(`Failed to fetch articles for category ${category.id}:`, err)
            articlesMap[category.id] = []
          }
        })
      )
      
      console.log(`✅ Fetched articles for ${Object.keys(articlesMap).length} categories`)
      
      const timestamp = Date.now()
      
      // Save to state
      setCategories(categoriesData)
      setAllArticles(articlesMap)
      setFaqs(faqsData)
      setPopularArticles(popularData)
      setLastFetch(timestamp)
      
      // Save to cache
      const cacheData = {
        data: {
          categories: categoriesData,
          allArticles: articlesMap,
          faqs: faqsData,
          popularArticles: popularData
        },
        timestamp
      }
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
      console.log('💾 Help center data cached')
      
    } catch (err) {
      console.error('Failed to fetch help center data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Manual refresh function
  const refresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered')
    localStorage.removeItem(CACHE_KEY)
    fetchAllData()
  }, [fetchAllData])

  // Get article count for a category
  const getArticleCount = useCallback((categoryId) => {
    return allArticles[categoryId]?.length || 0
  }, [allArticles])

  // Get articles for a category
  const getCategoryArticles = useCallback((categoryId) => {
    return allArticles[categoryId] || []
  }, [allArticles])

  const value = {
    categories,
    allArticles,
    faqs,
    popularArticles,
    loading,
    error,
    lastFetch,
    refresh,
    getArticleCount,
    getCategoryArticles,
    // Helpers
    isDataStale: lastFetch && (Date.now() - lastFetch) > CACHE_TTL,
    cacheAge: lastFetch ? Math.round((Date.now() - lastFetch) / 1000 / 60) : null, // minutes
  }

  return (
    <HelpCenterContext.Provider value={value}>
      {children}
    </HelpCenterContext.Provider>
  )
}

export function useHelpCenter() {
  const context = useContext(HelpCenterContext)
  if (!context) {
    throw new Error('useHelpCenter must be used within HelpCenterProvider')
  }
  return context
}
