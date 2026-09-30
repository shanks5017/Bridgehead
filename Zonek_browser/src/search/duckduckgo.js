'use strict';
/**
 * DUCKDUCKGO SEARCH PROVIDER
 * Unlimited, zero-auth factual check.
 * Source: DuckDuckGo Instant Answer API.
 */

const axios = require('axios');
const logger = require('../utils/logger');

const DDG_API = 'https://api.duckduckgo.com/';

/**
 * Quick factual check using DuckDuckGo.
 */
async function ddgSearch(query) {
  const resp = await axios.get(DDG_API, {
    params: {
      q: query,
      format: 'json',
      no_html: 1,
      skip_disambig: 1
    },
    timeout: 5000
  });

  const abstract = resp.data?.AbstractText;
  const source   = resp.data?.AbstractSource;
  const url      = resp.data?.AbstractURL;

  if (abstract) {
    return [{
      title:   source || 'DuckDuckGo Abstract',
      url:     url || '',
      content: abstract,
      source:  'ddg',
      score:   1
    }];
  }

  return [];
}

module.exports = { ddgSearch };
