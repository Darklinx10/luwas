/**
 * lib/api/firestoreErrorHandler.js
 * 
 * Intelligent Firestore error handler with:
 * - Code 9 (missing index) detection
 * - Index creation URL extraction
 * - Query field analysis
 * - Plain English explanations
 * - Query optimization suggestions
 * - Cursor-based pagination recommendations
 */

/**
 * Get the Firebase project ID from environment
 * @returns {string} Project ID or undefined
 */
function getProjectId() {
  return process.env.FIREBASE_PROJECT_ID;
}

/**
 * Normalize Firebase Console URL by removing account slot (/u/<number>/)
 * Converts: https://console.firebase.google.com/u/0/project/...
 * To: https://console.firebase.google.com/project/...
 * This allows the URL to work regardless of which Google account is logged in
 * @param {string} url - The Firebase Console URL
 * @returns {string|null} Normalized URL without account slot, or null if input is falsy
 */
function normalizeFirebaseConsoleUrl(url) {
  if (!url) return null;
  // Remove /u/<number>/ from the URL
  return url.replace(/\/u\/\d+\//, '/');
}

/**
 * Extract Firestore index creation URL from error message
 * Searches error message, details, and full error string for console links
 * Falls back to generating URL from project ID
 * Normalizes the URL to remove account slot so it works across all Google accounts
 * @param {Error} error - The Firestore error object
 * @returns {string|null} Firebase Console index URL or null
 */
export function extractFirestoreIndexUrl(error) {
  const errorMessage = error?.message || '';
  const errorDetails = error?.details || '';
  const fullError = String(error);

  let indexUrl = null;
  
  // Use pattern that captures full URL including query parameters
  const urlPattern = /https:\/\/console\.firebase\.google\.com\/[^\s"'<>{}|\\^`\]]+/g;

  // Search through all available error sources in order of likelihood
  const errorSources = [
    { source: errorMessage, label: 'message' },
    { source: errorDetails, label: 'details' },
    { source: fullError, label: 'full error' }
  ].filter(s => s.source && typeof s.source === 'string');
  
  for (const {source, label} of errorSources) {
    const matches = source.match(urlPattern);
    if (matches && matches.length > 0) {
      // Prefer the longest URL (most complete with all query params)
      indexUrl = matches.reduce((longest, current) => 
        current.length > longest.length ? current : longest
      );
      if (indexUrl) {
        console.debug(`✅ Index URL extracted from error.${label}`);
        // Normalize to remove account slot
        return normalizeFirebaseConsoleUrl(indexUrl);
      }
    }
  }

  // Fallback: Generate Firebase Console Indexes URL with actual project ID
  const projectId = getProjectId();
  if (projectId) {
    indexUrl = `https://console.firebase.google.com/project/${projectId}/firestore/databases/-default-/indexes`;
    return indexUrl;
  }

  // Last resort: generic link when project ID unavailable
  return 'https://console.firebase.google.com/project/_/firestore/indexes/composite';
}

/**
 * Parse Firestore error and extract composite index information
 * @param {Error} error - The Firestore error object
 * @param {Object} queryInfo - Query metadata { collection, where: [], orderBy: [] }
 * @returns {Object} Parsed error info with fields and suggestions
 */
export function analyzeFirestoreError(error, queryInfo = {}) {
  const errorCode = error?.code;
  const errorMessage = error?.message || '';
  const errorDetails = error?.details || '';
  const fullError = String(error);

  // Detect composite index error
  const isIndexError =
    errorCode === 9 ||
    errorMessage.includes('FAILED_PRECONDITION') ||
    errorMessage.includes('requires a composite index') ||
    errorMessage.includes('requires an index') ||
    errorDetails.includes('requires a composite index');

  // Extract index creation URL from error message
  // Firebase may provide a link in various places (message, details, or full error)
  let indexUrl = null;
  const urlPattern = /(https:\/\/console\.firebase\.google\.com\/[^\s"'<>]+)/;

  // Method 1: Check details field first (most common)
  if (errorDetails && typeof errorDetails === 'string') {
    const detailsMatch = errorDetails.match(urlPattern);
    if (detailsMatch) {
      indexUrl = detailsMatch[0];
    }
  }

  // Method 2: Check message field
  if (!indexUrl && errorMessage && typeof errorMessage === 'string') {
    const messageMatch = errorMessage.match(urlPattern);
    if (messageMatch) {
      indexUrl = messageMatch[0];
    }
  }

  // Method 3: Check full error string
  if (!indexUrl && typeof fullError === 'string') {
    const fullMatch = fullError.match(urlPattern);
    if (fullMatch) {
      indexUrl = fullMatch[0];
    }
  }

  // Fallback: Generate Firebase Console Indexes URL
  // Users can use this to navigate to their project's composite indexes
  if (!indexUrl) {
    indexUrl = 'https://console.firebase.google.com/project/_/firestore/indexes/composite';
  }

  // Normalize the URL to remove account slot (/u/<number>/)
  // This ensures the link works regardless of which Google account the user is logged into
  indexUrl = normalizeFirebaseConsoleUrl(indexUrl);

  // Analyze query fields
  const { collection = '', where = [], orderBy = [] } = queryInfo;

  // Build plain English explanation
  const fieldsList = generateFieldsList(where, orderBy);
  const explanation = generatePlainEnglishExplanation(
    collection,
    where,
    orderBy
  );

  // Generate optimization suggestions
  const suggestions = generateOptimizationSuggestions(where, orderBy, queryInfo);

  // Check if cursor-based pagination is recommended
  const paginationRecommendation = generatePaginationRecommendation(queryInfo);

  return {
    isIndexError,
    errorCode,
    errorMessage: errorMessage.split('\n')[0], // First line only
    fields: fieldsList,
    explanation,
    suggestions,
    paginationRecommendation,
    indexUrl,
    requiresAction: isIndexError,
    actionSteps: generateActionSteps(indexUrl, collection, where, orderBy),
  };
}

/**
 * Extract field names from where and orderBy clauses
 */
function generateFieldsList(where, orderBy) {
  const fields = [];

  // Add where fields
  if (Array.isArray(where)) {
    where.forEach(clause => {
      if (clause.field) {
        fields.push({
          name: clause.field,
          type: 'where',
          operator: clause.operator || '==',
          value: clause.value || null,
        });
      }
    });
  }

  // Add orderBy fields
  if (Array.isArray(orderBy)) {
    orderBy.forEach(clause => {
      if (clause.field) {
        fields.push({
          name: clause.field,
          type: 'orderBy',
          direction: clause.direction || 'asc',
        });
      }
    });
  }

  return fields;
}

/**
 * Generate human-readable explanation of the composite index requirement
 */
function generatePlainEnglishExplanation(collection, where, orderBy) {
  let explanation = `Your Firestore query on the "${collection}" collection `;

  // Describe the where conditions
  if (where.length > 0) {
    const conditions = where
      .map(c => `${c.field} ${c.operator} "${c.value}"`)
      .join(' AND ');
    explanation += `filters documents where ${conditions}`;
  }

  // Describe the orderBy
  if (orderBy.length > 0) {
    explanation += where.length > 0 ? ' and is ' : 'is ';
    const orders = orderBy
      .map(o => `${o.field} (${o.direction})`)
      .join(', then by ');
    explanation += `sorted by ${orders}`;
  }

  explanation += '. ';

  // Explain why an index is needed
  if (where.length > 0 && orderBy.length > 0) {
    explanation += `Firestore requires a composite index to efficiently execute queries that combine filters and sorts.`;
  } else if (where.length > 1) {
    explanation += `Firestore requires a composite index to efficiently execute queries with multiple filters.`;
  } else if (orderBy.length > 0) {
    explanation += `Firestore recommends a composite index for filtered and sorted queries.`;
  }

  return explanation;
}

/**
 * Generate optimization suggestions for the query
 */
function generateOptimizationSuggestions(where, orderBy, queryInfo) {
  const suggestions = [];

  // Check for inefficient patterns
  if (where.length > 0 && !orderBy.length && queryInfo.collection?.includes('collectionGroup')) {
    suggestions.push({
      severity: 'info',
      issue: 'Collection group query without ordering',
      recommendation: 'Consider adding an orderBy clause to improve performance and consistency',
      example: '.orderBy("createdAt", "desc")',
    });
  }

  if (queryInfo.pagination === 'offset') {
    suggestions.push({
      severity: 'warning',
      issue: 'Offset-based pagination detected',
      recommendation: 'Use cursor-based pagination (startAfter) for better performance with large datasets',
      benefit: 'Reduces Firestore read operations and improves response times',
      note: 'Store the last document from each page and use it as a cursor for the next page',
    });
  }

  // Check for selective fields
  if (!queryInfo.selectFields) {
    suggestions.push({
      severity: 'info',
      issue: 'Fetching all document fields',
      recommendation: 'Use .select() to fetch only needed fields if applicable',
      example: '.select("field1", "field2")',
      benefit: 'Reduces bandwidth and improves response time',
    });
  }

  return suggestions;
}

/**
 * Generate pagination recommendation
 */
function generatePaginationRecommendation(queryInfo) {
  const { pagination = 'offset' } = queryInfo;

  if (pagination === 'offset') {
    return {
      recommended: 'cursor-based',
      reason: 'Offset-based pagination requires Firestore to fetch and discard documents, increasing costs',
      implementation: 'Store the documentSnapshot from the last item of each page',
      example: 'const next = memberQuery.startAfter(lastDocSnapshot).limit(20)',
      benefits: [
        '✅ Reduces Firestore read operations',
        '✅ Better performance with large datasets',
        '✅ Consistent ordering independent of concurrent writes',
        '✅ Lower bandwidth usage',
      ],
    };
  }

  return {
    recommended: 'cursor-based',
    status: 'already-optimal',
  };
}

/**
 * Generate step-by-step action plan
 */
function generateActionSteps(indexUrl, collection, where, orderBy) {
  const fields = [...where.map(f => f.field), ...orderBy.map(f => f.field)];
  const fieldsList = fields.join(', ');

  return [
    {
      step: 1,
      description: 'Open Firebase Console Indexes',
      action: `Open your project's Composite Indexes`,
      link: indexUrl,
      instructions: 'Copy and paste this URL into your browser, or click consoleLink in the response',
    },
    {
      step: 2,
      description: 'Navigate to Composite Indexes',
      action: 'In Firestore: Cloud Firestore > Indexes > Composite indexes tab',
    },
    {
      step: 3,
      description: 'Create the required index',
      action: 'Click "Create Index"',
      details: {
        collection: `${collection} (or "members" if using collectionGroup)`,
        fields: fieldsList || 'isPWD',
      },
    },
    {
      step: 4,
      description: 'Wait for index to build',
      action: 'Status changes from "Creating" to "Enabled" (typically 2-5 minutes)',
    },
    {
      step: 5,
      description: 'Retry your request',
      action: 'The application will automatically use the index once it\'s enabled',
    },
  ];
}

/**
 * Generate detailed error report for console logging
 */
export function logFirestoreError(error, queryInfo = {}) {
  const analysis = analyzeFirestoreError(error, queryInfo);

  console.error('\n' + '═'.repeat(80));
  console.error('🔥 FIRESTORE QUERY ERROR - DETAILED ANALYSIS');
  console.error('═'.repeat(80));

  // Error details
  console.error('\n📋 ERROR INFORMATION:');
  console.error(`  Code: ${analysis.errorCode}`);
  console.error(`  Message: ${analysis.errorMessage}`);
  console.error(`  Index Required: ${analysis.requiresAction ? '⚠️  YES' : '✓ No'}`);

  // Query analysis
  if (analysis.fields.length > 0) {
    console.error('\n🔍 QUERY FIELDS INVOLVED:');
    analysis.fields.forEach(field => {
      if (field.type === 'where') {
        console.error(`  • ${field.name} ${field.operator} "${field.value}" (filter)`);
      } else {
        console.error(`  • ${field.name} (${field.direction}) (sort)`);
      }
    });
  }

  // Plain English explanation
  console.error('\n📖 EXPLANATION:');
  console.error(`  ${analysis.explanation}`);

  // Optimization suggestions
  if (analysis.suggestions.length > 0) {
    console.error('\n💡 OPTIMIZATION SUGGESTIONS:');
    analysis.suggestions.forEach(sug => {
      console.error(`  [${sug.severity.toUpperCase()}] ${sug.issue}`);
      console.error(`    → ${sug.recommendation}`);
      if (sug.example) console.error(`      Example: ${sug.example}`);
      if (sug.benefit) console.error(`      Benefit: ${sug.benefit}`);
    });
  }

  // Pagination recommendation
  if (analysis.paginationRecommendation.recommended) {
    console.error('\n📄 PAGINATION RECOMMENDATION:');
    console.error(`  Recommended: ${analysis.paginationRecommendation.recommended}`);
    if (analysis.paginationRecommendation.reason) {
      console.error(`  Why: ${analysis.paginationRecommendation.reason}`);
    }
    if (analysis.paginationRecommendation.example) {
      console.error(`  Example: ${analysis.paginationRecommendation.example}`);
    }
    if (analysis.paginationRecommendation.benefits) {
      console.error(`  Benefits:`);
      analysis.paginationRecommendation.benefits.forEach(b => {
        console.error(`    ${b}`);
      });
    }
  }

  // Action steps
  if (analysis.requiresAction) {
    console.error('\n📋 ACTION REQUIRED - STEPS TO FIX:');
    analysis.actionSteps.forEach(step => {
      console.error(`  ${step.step}. ${step.description}`);
      console.error(`     Action: ${step.action}`);
      if (step.details) {
        Object.entries(step.details).forEach(([key, value]) => {
          console.error(`     ${key}: ${value}`);
        });
      }
    });

    if (analysis.indexUrl) {
      console.error('\n🔗 DIRECT LINK:');
      console.error(`  ${analysis.indexUrl}`);
    }
  }

  console.error('\n' + '═'.repeat(80) + '\n');

  return analysis;
}
