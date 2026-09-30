'use strict';
/**
 * EXA SEARCH PROVIDER
 * Neural search that finds semantically similar content.
 * Free: 1,000 searches/month at exa.ai
 */

const Exa = require('exa-js').default;
const logger = require('../utils/logger');

const API_KEY = process.env.EXA_API_KEY || process.env.exa_api || '';

/**
 * Search using Exa API.
 * Returns array of { title, url, content, score }
 */
async function exaSearch(query, maxResults = 5) {
  if (!API_KEY) {
    throw new Error('Exa API key not configured');
  }

  const exa = new Exa(API_KEY);

  const results = await exa.search(query, {
    type: "auto",
    numResults: maxResults,
    useAutoprompt: true, // Though deprecated, it helps with keyword queries
  });

  return (results.results || []).map((r) => ({
    title:   r.title || '',
    url:     r.url || '',
    content: r.text || '', // Exa sometimes returns text directly if requested, otherwise we'll fetch separately
    score:   r.score || 0,
    source:  'exa',
  }));
}

module.exports = { exaSearch };
