'use strict';
/**
 * UNIFIED SEARCH PROVIDER
 * Implements the fallback logic for web searching.
 */

const { tavilySearch } = require('./tavily');
const { exaSearch }    = require('./exa');
const { serperSearch }  = require('./serper');
const { jinaSearch }    = require('./jina');
const { ddgSearch }     = require('./duckduckgo');
const logger = require('../utils/logger');

/**
 * Unified search with fallback chain.
 * Tavily -> Exa -> Serper -> Jina -> DDG
 */
async function unifiedSearch(query, maxResults = 5) {
  // 1. Try Tavily (Primary)
  try {
    logger.info(`[Search] Trying Tavily for: "${query}"`);
    return await tavilySearch(query, maxResults);
  } catch (err) {
    logger.warn(`[Search] Tavily failed: ${err.message}`);
  }

  // 2. Try Exa (Fallback 1)
  try {
    logger.info(`[Search] Trying Exa for: "${query}"`);
    return await exaSearch(query, maxResults);
  } catch (err) {
    logger.warn(`[Search] Exa failed: ${err.message}`);
  }

  // 3. Try Serper (Fallback 2)
  try {
    logger.info(`[Search] Trying Serper for: "${query}"`);
    return await serperSearch(query, maxResults);
  } catch (err) {
    logger.warn(`[Search] Serper failed: ${err.message}`);
  }

  // 4. Try Jina (Fallback 3)
  try {
    logger.info(`[Search] Trying Jina for: "${query}"`);
    return await jinaSearch(query);
  } catch (err) {
    logger.warn(`[Search] Jina failed: ${err.message}`);
  }

  // 5. Try DDG (Last resort)
  try {
    logger.info(`[Search] Trying DDG for: "${query}"`);
    return await ddgSearch(query);
  } catch (err) {
    logger.warn(`[Search] DDG failed: ${err.message}`);
  }

  return [];
}

module.exports = { unifiedSearch };
