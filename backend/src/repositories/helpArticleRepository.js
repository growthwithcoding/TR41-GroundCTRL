/**
 * Help Article Repository
 * Database operations for help articles
 */

const { getFirestore } = require('../config/firebase');

const COLLECTION = 'help_articles';

/**
 * Get article by ID
 */
async function getById(id) {
  const db = getFirestore();
  const doc = await db.collection(COLLECTION).doc(id).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return {
    id: doc.id,
    ...doc.data()
  };
}

/**
 * Get article by slug
 */
async function getBySlug(slug) {
  const db = getFirestore();
  const snapshot = await db.collection(COLLECTION)
    .where('slug', '==', slug)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  };
}

/**
 * Get all articles with filters and pagination
 * CRUD factory passes all options as a single object
 */
async function getAll(options = {}) {
  const db = getFirestore();
  let query = db.collection(COLLECTION);
  
  // Extract pagination from options
  const page = options.page || 1;
  const limit = options.limit || 20;
  
  // Track if we're using a where clause on a non-sort field
  let hasFilterClause = false;
  
  // Default to published and active articles unless explicitly overridden
  const status = options.status !== undefined ? options.status : 'PUBLISHED';
  const isActive = options.isActive !== undefined ? options.isActive : true;
  
  // Apply default status filters
  if (status) {
    query = query.where('status', '==', status);
    hasFilterClause = true;
  }
  
  if (isActive !== undefined) {
    query = query.where('isActive', '==', isActive);
    hasFilterClause = true;
  }
  
  // Apply filters
  if (options.category_id) {
    query = query.where('category_id', '==', options.category_id);
    hasFilterClause = true;
  }
  
  if (options.type) {
    query = query.where('type', '==', options.type);
    hasFilterClause = true;
  }
  
  if (options.difficulty) {
    query = query.where('difficulty', '==', options.difficulty);
    hasFilterClause = true;
  }
  
  
  if (options.isFeatured !== undefined) {
    query = query.where('isFeatured', '==', options.isFeatured);
    hasFilterClause = true;
  }
  
  // Firestore limitation: When using where() on one field and orderBy() on another,
  // you need a composite index. To avoid this, we'll fetch data and sort in memory
  // when filters are applied.
  const sortBy = options.sortBy || 'orderIndex';
  const sortOrder = options.sortOrder || 'asc';
  
  // Only apply orderBy in Firestore if no filter clauses (avoids composite index requirement)
  if (!hasFilterClause) {
    query = query.orderBy(sortBy, sortOrder);
  }
  
  // Apply pagination if needed
  if (page > 1 || limit < 100) {
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);
  }
  
  const snapshot = await query.get();
  
  let data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Sort in memory if we had filter clauses
  if (hasFilterClause) {
    data.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      // Handle undefined/null values
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      
      // Numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      // String comparison
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }
  
  // Return actual data length as total
  return {
    data,
    total: data.length
  };
}

/**
 * Search articles (simple implementation)
 */
async function search(searchTerm, filters = {}, limit = 10) {
  // Note: This is a basic implementation
  // For production, consider using Algolia or Elasticsearch
  const db = getFirestore();
  let query = db.collection(COLLECTION);
  
  // Apply status filter for published articles
  query = query.where('status', '==', 'PUBLISHED');
  query = query.where('isActive', '==', true);
  
  // Category filter if provided
  if (filters.category_id) {
    query = query.where('category_id', '==', filters.category_id);
  }
  
  query = query.limit(limit);
  
  const snapshot = await query.get();
  
  // Filter by search term in memory (basic approach)
  const searchLower = searchTerm.toLowerCase();
  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    .filter(article => {
      const titleMatch = article.title?.toLowerCase().includes(searchLower);
      const excerptMatch = article.excerpt?.toLowerCase().includes(searchLower);
      const tagMatch = article.tags?.some(tag => tag.toLowerCase().includes(searchLower));
      return titleMatch || excerptMatch || tagMatch;
    });
}

/**
 * Create new article
 */
async function create(data) {
  const db = getFirestore();
  const now = new Date().toISOString();
  
  const articleData = {
    ...data,
    views: 0,
    helpfulCount: 0,
    notHelpfulCount: 0,
    createdAt: now,
    updatedAt: now
  };
  
  const docRef = await db.collection(COLLECTION).add(articleData);
  
  return {
    id: docRef.id,
    ...articleData
  };
}

/**
 * Update article
 */
async function update(id, data) {
  const db = getFirestore();
  const now = new Date().toISOString();
  
  const updateData = {
    ...data,
    updatedAt: now
  };
  
  await db.collection(COLLECTION).doc(id).update(updateData);
  
  return getById(id);
}

/**
 * Delete article
 */
async function deleteById(id) {
  const db = getFirestore();
  await db.collection(COLLECTION).doc(id).delete();
  return true;
}

/**
 * Increment view count
 */
async function incrementViews(id) {
  const db = getFirestore();
  const docRef = db.collection(COLLECTION).doc(id);
  
  await docRef.update({
    views: require('firebase-admin').firestore.FieldValue.increment(1)
  });
  
  return getById(id);
}

/**
 * Update feedback counts
 */
async function updateFeedback(id, isHelpful) {
  const db = getFirestore();
  const docRef = db.collection(COLLECTION).doc(id);
  
  const field = isHelpful ? 'helpfulCount' : 'notHelpfulCount';
  
  await docRef.update({
    [field]: require('firebase-admin').firestore.FieldValue.increment(1)
  });
  
  return getById(id);
}

/**
 * Check if slug exists
 */
async function existsBySlug(slug, excludeId = null) {
  const db = getFirestore();
  const snapshot = await db.collection(COLLECTION)
    .where('slug', '==', slug)
    .get();
  
  if (excludeId) {
    return snapshot.docs.some(doc => doc.id !== excludeId);
  }
  
  return !snapshot.empty;
}

/**
 * Get popular articles (top by views with fallback)
 * Returns top N articles by view count, or first N if views are low/missing
 */
async function getPopular(limit = 4) {
  const db = getFirestore();
  
  // Get all published, active articles
  let query = db.collection(COLLECTION)
    .where('status', '==', 'PUBLISHED')
    .where('isActive', '==', true);
  
  const snapshot = await query.get();
  
  const articles = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Sort by views (descending), then by createdAt (newest first) as fallback
  articles.sort((a, b) => {
    const viewsA = a.views || 0;
    const viewsB = b.views || 0;
    
    // If views are different, sort by views
    if (viewsB !== viewsA) {
      return viewsB - viewsA;
    }
    
    // If views are the same, sort by creation date (newest first)
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateB - dateA;
  });
  
  return articles.slice(0, limit);
}

module.exports = {
  getById,
  getBySlug,
  getAll,
  search,
  create,
  update,
  deleteById,
  incrementViews,
  updateFeedback,
  existsBySlug,
  getPopular
};
