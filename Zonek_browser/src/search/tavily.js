'use strict';
/**
 * TAVILY SEARCH PROVIDER
 * Primary search — AI-optimized, returns full content + source scores.
 * Free: 1,000 searches/month at tavily.com
 */

const axios = require('axios');
const logger = require('../utils/logger');

const TAVILY_API = 'https://api.tavily.com/search';
const API_KEY    = process.env.TAVILY_KEY || '';

/**
 * Search using Tavily API.
 * Returns array of { title, url, content, score }
 */
async function tavilySearch(query, maxResults = 5) {
  if (!API_KEY || API_KEY.startsWith('tvly-REPLACE')) {
    throw new Error('Tavily API key not configured');
  }

  const resp = await axios.post(
    TAVILY_API,
    {
      api_key: API_KEY,
      query,
      search_depth: 'basic',       // 'advanced' uses 2 credits
      include_answer: false,
      include_raw_content: false,
      max_results: maxResults,
      include_domains: [],          // No restriction — search all
      exclude_domains: ['reddit.com', 'quora.com', 'twitter.com'],
    },
    { timeout: 10000 }
  );

  const results = resp.data?.results || [];
  return results.map((r) => ({
    title:   r.title || '',
    url:     r.url || '',
    content: r.content || '',
    score:   r.score || 0,
    source:  'tavily',
  }));
}

module.exports = { tavilySearch };
