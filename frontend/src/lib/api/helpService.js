/**
 * Help Service
 * Fetches help center data from backend API (Firestore)
 */

import api from './httpClient'

/**
 * Get all published help categories
 * @returns {Promise<Array>} List of categories
 */
export async function getCategories() {
  try {
    const response = await api.get('/help/categories', {}, false) // No auth required
    return response.payload?.data || []
  } catch (error) {
    // Silently fail in test environments (backend may not be running)
    if (!error.message?.includes('Failed to fetch') && !error.message?.includes('ERR_CONNECTION_REFUSED')) {
      console.error('Failed to fetch help categories:', error)
    }
    return []
  }
}

/**
 * Get all help articles with optional filtering
 * @param {Object} params - Query parameters
 * @param {string} params.category_id - Filter by category ID
 * @param {string} params.search - Search term
 * @returns {Promise<Array>} List of articles
 */
export async function getArticles(params = {}) {
  try {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/help/articles?${queryString}` : '/help/articles'
    const response = await api.get(endpoint, {}, false) // No auth required
    return response.payload?.data || []
  } catch (error) {
    console.error('Failed to fetch help articles:', error)
    return []
  }
}

/**
 * Get a specific article by slug
 * @param {string} slug - Article slug
 * @returns {Promise<Object|null>} Article data or null if not found
 */
export async function getArticleBySlug(slug) {
  try {
    const response = await api.get(`/help/articles/${slug}`, {}, false) // No auth required
    return response.payload?.data || null
  } catch (error) {
    console.error(`Failed to fetch article with slug ${slug}:`, error)
    return null
  }
}

/**
 * Get all FAQs with optional filtering
 * @param {Object} params - Query parameters
 * @param {string} params.category_id - Filter by category ID
 * @param {string} params.search - Search term
 * @returns {Promise<Array>} List of FAQs
 */
export async function getFaqs(params = {}) {
  try {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/help/faqs?${queryString}` : '/help/faqs'
    const response = await api.get(endpoint, {}, false) // No auth required
    return response.payload?.data || []
  } catch (error) {
    // Silently fail in test environments (backend may not be running)
    if (!error.message?.includes('Failed to fetch') && !error.message?.includes('ERR_CONNECTION_REFUSED')) {
      console.error('Failed to fetch FAQs:', error)
    }
    return []
  }
}

/**
 * Search help content (articles and FAQs)
 * @param {string} query - Search query
 * @returns {Promise<Object>} Search results with articles and FAQs
 */
export async function searchHelp(query) {
  try {
    const response = await api.get(`/help/search?q=${encodeURIComponent(query)}`, {}, false)
    return response.payload?.data || { articles: [], faqs: [] }
  } catch (error) {
    console.error('Failed to search help content:', error)
    return { articles: [], faqs: [] }
  }
}

/**
 * Get articles by category ID
 * @param {string} categoryId - Category ID
 * @param {number} limit - Maximum number of articles to return (default: 100 for all)
 * @returns {Promise<Array>} List of articles
 */
export async function getArticlesByCategory(categoryId, limit = 100) {
  return getArticles({ category_id: categoryId, limit })
}

/**
 * Get popular/featured articles
 * Fetches top articles by view count from dedicated backend endpoint
 * @param {number} limit - Number of articles to return
 * @returns {Promise<Array>} List of popular articles
 */
export async function getPopularArticles(limit = 4) {
  try {
    const response = await api.get(`/help/articles/popular?limit=${limit}`, {}, false)
    return response.payload?.data?.articles || []
  } catch (error) {
    // Silently fail in test environments (backend may not be running)
    if (!error.message?.includes('Failed to fetch') && !error.message?.includes('ERR_CONNECTION_REFUSED')) {
      console.error('Failed to fetch popular articles:', error)
    }
    return []
  }
}
