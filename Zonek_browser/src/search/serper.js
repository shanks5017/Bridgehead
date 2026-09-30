'use strict';
/**
 * SERPER SEARCH PROVIDER
 * Real-time Google results as structured JSON.
 * Free: 2,500 one-time searches at serper.dev
 */

const axios = require('axios');
const logger = require('../utils/logger');

const SERPER_API = 'https://google.serper.dev/search';
const API_KEY    = process.env.SERPER_KEY || '';

/**
 * Search using Serper API.
 * Returns array of { title, url, snippet, score }
 */
async function serperSearch(query, maxResults = 5) {
  if (!API_KEY) {
    throw new Error('Serper API key not configured');
  }

  const resp = await axios.post(
    SERPER_API,
    {
      q: query,
      num: maxResults,
      gl: 'in', // Geolocation: India
      hl: 'en', // Language: English
    },
    { 
      headers: { 
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000 
    }
  );

  const results = resp.data?.organic || [];
  return results.map((r) => ({
    title:   r.title || '',
    url:     r.link || '',
    content: r.snippet || '',
    score:   1, // Serper doesn't provide relevance score like Tavily
    source:  'serper',
  }));
}

module.exports = { serperSearch };
