/**
 * Help Article Schemas
 * 
 * Zod validation schem help center CRUD operations
 * Covers: articles, categories, FAQs, and search
 * 
 * Collections:
 * - help_categories: Top-level groupings
 * - help_articles: Individual help content
 * - help_faqs: Frequently asked questions
 * - help_feedback: User feedback on articles
 */

import { z } from 'zod';

// ============================================================
// SHARED ENUMS
// ============================================================

export const articleStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'NEEDS_REVIEW']);

export const articleTypeEnum = z.enum([
  'GUIDE',           // Step-by-step tutorial
  'REFERENCE',       // Technical reference
  'TROUBLESHOOTING', // Problem/solution format
  'FAQ',             // Frequently asked question
  'RELEASE_NOTES',   // Version updates
  'GLOSSARY'         // Term definitions
]);

export const categoryEnum = z.enum([
  'GETTING_STARTED',
  'MISSIONS',
  'SATELLITE_OPERATIONS',
  'COMMUNICATIONS',
  'NOVA_AI',
  'ACCOUNT_SETTINGS',
  'TROUBLESHOOTING',
  'BILLING',
  'API_REFERENCE',
  'RELEASE_NOTES'
]);

export const difficultyEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

export const feedbackTypeEnum = z.enum(['HELPFUL', 'NOT_HELPFUL', 'NEEDS_UPDATE', 'INCORRECT']);

export const contentBlockTypeEnum = z.enum([
  'PARAGRAPH',
  'HEADING',
  'LIST',
  'CODE',
  'IMAGE',
  'VIDEO',
  'CALLOUT',
  'STEP',
  'TABLE',
  'DIVIDER'
]);

export const calloutTypeEnum = z.enum(['INFO', 'WARNING', 'TIP', 'DANGER', 'SUCCESS']);

// ============================================================
// NESTED OBJECT SCHEMAS
// ============================================================

// Content block schema for rich article content
export const contentBlockSchema = z.discriminatedUnion('type', [
  // Paragraph block
  z.object({
    type),
    content: z.string().max(10000),
  }),
  
  // Heading block
  z.object({
    type),
    level: z.number().int().min(1).max(6),
    content: z.string().max(500),
    anchor: z.string().max(100).optional()
      .describe('URL anchor for deep linking'),
  }),
  
  // List block
  z.object({
    type),
    ordered: z.boolean().default(false),
    items: z.array(z.string().max(1000)).max(50),
  }),
  
  // Code block
  z.object({
    type),
    language: z.string().max(50).optional(),
    content: z.string().max(50000),
    filename: z.string().max(200).optional(),
    highlightLines: z.array(z.number().int().positive()).optional(),
  }),
  
  // Image block
  z.object({
    type),
    url: z.string().url(),
    alt: z.string().max(500),
    caption: z.string().max(500).optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  }),
  
  // Video block
  z.object({
    type),
    url: z.string().url(),
    title: z.string().max(200).optional(),
    duration_seconds: z.number().int().positive().optional(),
    thumbnail_url: z.string().url().optional(),
  }),
  
  // Callout block (info, warning, tip, etc.)
  z.object({
    type),
    calloutType: calloutTypeEnum,
    title: z.string().max(200).optional(),
    content: z.string().max(2000),
  }),
  
  // Step block (for tutorials)
  z.object({
    type),
    stepNumber: z.number().int().positive(),
    title: z.string().max(200),
    content: z.string().max(5000),
    imageUrl: z.string().url().optional(),
  }),
  
  // Table block
  z.object({
    type),
    headers: z.array(z.string().max(200)).max(10),
    rows: z.array(z.array(z.string().max(1000))).max(100),
    caption: z.string().max(500).optional(),
  }),
  
  // Divider block
  z.object({
    type),
  }),
]);

// SEO metadata schema
export const seoMetadataSchema = z.object({
  metaTitle).max(70).optional()
    .describe('Override page title for SEO (max 70 chars)'),
  metaDescription: z.string().max(160).optional()
    .describe('Meta description for search results (max 160 chars)'),
  keywords: z.array(z.string().max(50)).max(10).optional(),
  canonicalUrl: z.string().url().optional(),
  noIndex: z.boolean().default(false)
    .describe('Exclude from search engines'),
}).strict().optional();

// Related content schema
export const relatedContentSchema = z.object({
  articles)).max(5).optional()
    .describe('Related article IDs'),
  scenarios: z.array(z.string()).max(3).optional()
    .describe('Related scenario IDs'),
  externalLinks: z.array(z.object({
    title).max(200),
    url: z.string().url(),
    description: z.string().max(500).optional(),
  })).max(5).optional(),
}).strict().optional();

// Article stats schema (typically server-managed)
export const articleStatsSchema = z.object({
  views).int().min(0).default(0),
  helpfulCount: z.number().int().min(0).default(0),
  notHelpfulCount: z.number().int().min(0).default(0),
  searchAppearances: z.number().int().min(0).default(0),
  avgTimeOnPage_seconds: z.number().min(0).optional(),
}).strict().optional();

// ============================================================
// HELP CATEGORY SCHEMAS
// ============================================================

export const createCategorySchema = z.object({
  body)
      .min(1, 'Category code is required')
      .max(50)
      .regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric with underscores')
      .describe('Unique category identifier'),
    
    name: z.string()
      .min(1, 'Name is required')
      .max(100)
      .trim()
      .describe('Display name for the category'),
    
    description: z.string()
      .max(500)
      .trim()
      .optional()
      .describe('Brief category description'),
    
    icon: z.string()
      .max(50)
      .optional()
      .describe('Icon name (e.g., Lucide icon name)'),
    
    color: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be hex format')
      .optional()
      .describe('Category accent color'),
    
    orderIndex: z.number()
      .int()
      .min(0)
      .default(0)
      .describe('Sort order (lower = first)'),
    
    isActive: z.boolean()
      .default(true),
    
    parentCategoryId: z.string()
      .optional()
      .describe('For nested categories'),
    
  }).strict(),
}).strict();

export const updateCategorySchema = z.object({
  params).min(1, 'Category ID is required'),
  }).strict(),
  body: createCategorySchema.shape.body,
}).strict();

export const patchCategorySchema = z.object({
  params).min(1, 'Category ID is required'),
  }).strict(),
  body: createCategorySchema.shape.body.partial().refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided'
  ),
}).strict();

// ============================================================
// HELP ARTICLE SCHEMAS
// ============================================================

export const createArticleSchema = z.object({
  body)
      .min(1, 'Slug is required')
      .max(200)
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
      .describe('URL-friendly identifier'),
    
    title: z.string()
      .min(1, 'Title is required')
      .max(200)
      .trim()
      .describe('Article title'),
    
    subtitle: z.string()
      .max(300)
      .trim()
      .optional()
      .describe('Optional subtitle or tagline'),
    
    excerpt: z.string()
      .max(500)
      .trim()
      .optional()
      .describe('Short summary for search results and cards'),
    
    // ---------- Classification ----------
    category_id: z.string()
      .min(1, 'Category ID is required')
      .describe('FK to help_categories.id'),
    
    type: articleTypeEnum
      .default('GUIDE')
      .describe('Article format type'),
    
    difficulty: difficultyEnum
      .optional()
      .describe('Content difficulty level'),
    
    tags: z.array(z.string().max(50))
      .max(10)
      .optional()
      .describe('Tags for filtering and search'),
    
    // ---------- Content ----------
    content: z.array(contentBlockSchema)
      .min(1, 'At least one content block is required')
      .max(100)
      .describe('Structured content blocks'),
    
    // Plain text version for search indexing
    plainTextContent: z.string()
      .max(100000)
      .optional()
      .describe('Auto-generated plain text for full-text search'),
    
    // ---------- Status & Visibility ----------
    status: articleStatusEnum
      .default('DRAFT')
      .describe('Publishing status'),
    
    isActive: z.boolean()
      .default(true),
    
    isFeatured: z.boolean()
      .default(false)
      .describe('Show in featured/popular section'),
    
    isPinned: z.boolean()
      .default(false)
      .describe('Pin to top of category'),
    
    // ---------- Ordering ----------
    orderIndex: z.number()
      .int()
      .min(0)
      .default(0)
      .describe('Sort order within category'),
    
    // ---------- Reading Experience ----------
    estimatedReadMinutes: z.number()
      .int()
      .positive()
      .max(60)
      .optional()
      .describe('Estimated reading time'),
    
    // ---------- Media ----------
    thumbnailUrl: z.string()
      .url()
      .optional()
      .describe('Thumbnail image for cards'),
    
    heroImageUrl: z.string()
      .url()
      .optional()
      .describe('Large header image'),
    
    // ---------- Related Content ----------
    relatedContent: relatedContentSchema,
    
    // ---------- SEO ----------
    seo: seoMetadataSchema,
    
    // ---------- Version Control ----------
    version: z.string()
      .regex(/^\d+\.\d+\.\d+$/, 'Version must be semver format')
      .default('1.0.0'),
    
    // ---------- Authorship ----------
    author_id: z.string()
      .optional()
      .describe('FK to users.id (content author)'),
    
    reviewer_id: z.string()
      .optional()
      .describe('FK to users.id (content reviewer)'),
    
    // ---------- Scheduling ----------
    publishedAt: z.string()
      .datetime()
      .optional()
      .describe('When article was/will be published'),
    
    expiresAt: z.string()
      .datetime()
      .optional()
      .describe('Auto-archive date'),
    
    lastReviewedAt: z.string()
      .datetime()
      .optional()
      .describe('Last content review date'),
    
  }).strict(),
}).strict();

export const updateArticleSchema = z.object({
  params).min(1, 'Article ID is required'),
  }).strict(),
  body: createArticleSchema.shape.body,
}).strict();

export const patchArticleSchema = z.object({
  params).min(1, 'Article ID is required'),
  }).strict(),
  body: createArticleSchema.shape.body.partial().refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided'
  ),
}).strict();

export const listArticlesSchema = z.object({
  query)
      .optional()
      .transform((val) => val ? parseInt(val, 10) : 1)
      .refine((val) => val >= 1, 'Page must be 1 or greater'),
    
    limit: z.string()
      .optional()
      .transform((val) => val ? parseInt(val, 10) : 20)
      .refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
    
    sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'orderIndex', 'views', 'helpfulCount'])
      .optional()
      .default('orderIndex'),
    
    sortOrder: z.enum(['asc', 'desc'])
      .optional()
      .default('asc'),
    
    // Filters
    category_id: z.string().optional(),
    type: articleTypeEnum.optional(),
    difficulty: difficultyEnum.optional(),
    status: articleStatusEnum.optional(),
    
    isActive: z.string()
      .optional()
      .transform((val) => val === 'true'),
    
    isFeatured: z.string()
      .optional()
      .transform((val) => val === 'true'),
    
    // Search
    search: z.string()
      .max(200)
      .optional()
      .describe('Full-text search in title, excerpt, and content'),
    
    tag: z.string()
      .max(50)
      .optional()
      .describe('Filter by tag'),
    
  }).strict(),
}).strict();

// ============================================================
// FAQ SCHEMAS
// ============================================================

export const createFaqSchema = z.object({
  body)
      .min(1, 'Question is required')
      .max(500)
      .trim(),
    
    answer: z.string()
      .min(1, 'Answer is required')
      .max(5000)
      .trim()
      .describe('Plain text or markdown answer'),
    
    answerBlocks: z.array(contentBlockSchema)
      .max(20)
      .optional()
      .describe('Rich content blocks (alternative to plain answer)'),
    
    category_id: z.string()
      .min(1, 'Category ID is required'),
    
    tags: z.array(z.string().max(50))
      .max(5)
      .optional(),
    
    orderIndex: z.number()
      .int()
      .min(0)
      .default(0),
    
    status: articleStatusEnum
      .default('DRAFT'),
    
    isActive: z.boolean()
      .default(true),
    
    isFeatured: z.boolean()
      .default(false)
      .describe('Show in main FAQ section'),
    
    relatedArticleIds: z.array(z.string())
      .max(3)
      .optional(),
    
  }).strict(),
}).strict();

export const updateFaqSchema = z.object({
  params).min(1, 'FAQ ID is required'),
  }).strict(),
  body: createFaqSchema.shape.body,
}).strict();

export const patchFaqSchema = z.object({
  params).min(1, 'FAQ ID is required'),
  }).strict(),
  body: createFaqSchema.shape.body.partial().refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided'
  ),
}).strict();

export const listFaqsSchema = z.object({
  query)
      .optional()
      .transform((val) => val ? parseInt(val, 10) : 1),
    
    limit: z.string()
      .optional()
      .transform((val) => val ? parseInt(val, 10) : 20),
    
    category_id: z.string().optional(),
    status: articleStatusEnum.optional(),
    
    isFeatured: z.string()
      .optional()
      .transform((val) => val === 'true'),
    
    search: z.string()
      .max(200)
      .optional(),
    
  }).strict(),
}).strict();

// ============================================================
// FEEDBACK SCHEMAS
// ============================================================

export const createFeedbackSchema = z.object({
  body)
      .min(1, 'Article ID is required'),
    
    user_id: z.string()
      .optional()
      .describe('FK to users.id (optional for anonymous feedback)'),
    
    type: feedbackTypeEnum,
    
    comment: z.string()
      .max(2000)
      .trim()
      .optional()
      .describe('Optional detailed feedback'),
    
    // For NEEDS_UPDATE or INCORRECT
    suggestedCorrection: z.string()
      .max(5000)
      .trim()
      .optional(),
    
  }).strict(),
}).strict();

// ============================================================
// SEARCH SCHEMAS
// ============================================================

export const searchHelpSchema = z.object({
  query)
      .min(1, 'Search query is required')
      .max(200)
      .describe('Search query string'),
    
    limit: z.string()
      .optional()
      .transform((val) => val ? parseInt(val, 10) : 10)
      .refine((val) => val >= 1 && val <= 50, 'Limit must be between 1 and 50'),
    
    // Filter results
    category_id: z.string().optional(),
    type: z.enum(['ALL', 'ARTICLES', 'FAQS']).optional().default('ALL'),
    
  }).strict(),
}).strict();

// ============================================================
// TYPE EXPORTS
// ============================================================

