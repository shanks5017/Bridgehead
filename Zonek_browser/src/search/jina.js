'use strict';
/**
 * JINA SEARCH PROVIDER
 * Zero-auth search and reader API.
 * Free: ~20 RPM without an API key.
 */

const axios = require('axios');
const logger = require('../utils/logger');

const JINA_SEARCH_URL = 'https://s.jina.ai/';
const JINA_READER_URL = 'https://r.jina.ai/';

/**
 * Search using Jina Search API (s.jina.ai).
 * Returns array of { title, url, content }
 */
async function jinaSearch(query) {
  const resp = await axios.get(`${JINA_SEARCH_URL}${encodeURIComponent(query)}`, {
    headers: { 'Accept': 'application/json' },
    timeout: 15000
  });

  const results = resp.data?.data || [];
  return results.map((r) => ({
    title:   r.title || '',
    url:     r.url || '',
    content: r.content || '',
    source:  'jina',
  }));
}

/**
 * Read page content using Jina Reader API (r.jina.ai).
 * Converts any URL to clean markdown.
 * Uses Promise.race to enforce a hard 12s timeout — prevents silent pipeline hangs.
 */
async function jinaRead(url) {
  const TIMEOUT_MS = 12000;
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
  );

  const fetchPromise = axios.get(`${JINA_READER_URL}${url}`, {
    headers: { 'Accept': 'application/json' },
    timeout: TIMEOUT_MS,
  }).then(resp => ({
    title:   resp.data?.data?.title || '',
    content: resp.data?.data?.content || '',
    url:     resp.data?.data?.url || url,
    source:  'jina-reader'
  }));

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err) {
    logger.warn(`[Jina Reader] Failed to read ${url}: ${err.message}`);
    return null;
  }
}

module.exports = { jinaSearch, jinaRead };
