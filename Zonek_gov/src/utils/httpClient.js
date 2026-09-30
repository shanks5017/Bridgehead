'use strict';
const axios = require('axios');
const logger = require('./logger');

/**
 * Axios with exponential backoff retry.
 * @param {object} axiosConfig - Standard axios request config
 * @param {object} options
 * @param {number} options.retries - Max retry attempts (default: 4)
 * @param {number} options.baseDelay - Base delay in ms (default: 1000)
 * @param {string} options.module - Module name for logging
 */
async function fetchWithRetry(axiosConfig, { retries = 4, baseDelay = 1000, module = 'unknown' } = {}) {
  const instance = axios.create({ timeout: 30000 });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await instance(axiosConfig);
      return response;
    } catch (err) {
      const isLast = attempt === retries;
      const status = err.response?.status;
      const delay = baseDelay * Math.pow(2, attempt - 1); // 1s, 2s, 4s, 8s

      // Don't retry on 4xx client errors (except 429 rate limit)
      if (status && status >= 400 && status < 500 && status !== 429) {
        logger.error(`[${module}] HTTP ${status} — not retrying. ${axiosConfig.url}`);
        throw err;
      }

      if (isLast) {
        logger.error(`[${module}] All ${retries} attempts failed: ${err.message}`);
        throw err;
      }

      logger.warn(`[${module}] Attempt ${attempt} failed (${err.message}). Retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

module.exports = { fetchWithRetry };
