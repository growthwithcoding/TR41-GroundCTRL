/**
 * Help FAQ Repository
 * Database operations for FAQs
 */

const { getFirestore } = require('../config/firebase');

const COLLECTION = 'help_faqs';

/**
 * Get FAQ by ID
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
 * Get all FAQs with filters and pagination
 * CRUD factory passes all options as a single object
 */
async function getAll(options = {}) {
  const db = getFirestore();
  let query = db.collection(COLLECTION);
  
  // Extract pagination from options
  const page = options.page || 1;
  const limit = options.limit || 20;
  
  // Apply filters
  if (options.category_id) {
    query = query.where('category_id', '==', options.category_id);
  }
  
  if (options.status) {
    query = query.where('status', '==', options.status);
  }
  
  if (options.isActive !== undefined) {
    query = query.where('isActive', '==', options.isActive);
  }
  
  if (options.isFeatured !== undefined) {
    query = query.where('isFeatured', '==', options.isFeatured);
  }
  
  // Ordering
  query = query.orderBy('orderIndex', 'asc');
  
  // Get total count before applying pagination
  const countSnapshot = await query.get();
  const total = countSnapshot.size;
  
  // Apply pagination
  const offset = (page - 1) * limit;
  query = query.offset(offset).limit(limit);
  
  const snapshot = await query.get();
  
  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Return in format expected by CRUD factory with actual total count
  return {
    data,
    total
  };
}

/**
 * Search FAQs
 */
async function search(searchTerm, filters = {}, limit = 10) {
  const db = getFirestore();
  let query = db.collection(COLLECTION);
  
  // Apply status filter for published FAQs
  query = query.where('status', '==', 'PUBLISHED');
  query = query.where('isActive', '==', true);
  
  // Category filter if provided
  if (filters.category_id) {
    query = query.where('category_id', '==', filters.category_id);
  }
  
  query = query.limit(limit);
  
  const snapshot = await query.get();
  
  // Filter by search term in memory
  const searchLower = searchTerm.toLowerCase();
  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    .filter(faq => {
      const questionMatch = faq.question?.toLowerCase().includes(searchLower);
      const answerMatch = faq.answer?.toLowerCase().includes(searchLower);
      const tagMatch = faq.tags?.some(tag => tag.toLowerCase().includes(searchLower));
      return questionMatch || answerMatch || tagMatch;
    });
}

/**
 * Create new FAQ
 */
async function create(data) {
  const db = getFirestore();
  const now = new Date().toISOString();
  
  const faqData = {
    ...data,
    createdAt: now,
    updatedAt: now
  };
  
  const docRef = await db.collection(COLLECTION).add(faqData);
  
  return {
    id: docRef.id,
    ...faqData
  };
}

/**
 * Update FAQ
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
 * Delete FAQ
 */
async function deleteById(id) {
  const db = getFirestore();
  await db.collection(COLLECTION).doc(id).delete();
  return true;
}

module.exports = {
  getById,
  getAll,
  search,
  create,
  update,
  deleteById
};
