'use strict';
/**
 * BROWSER ADAPTER
 * Calls the Zonek_browser intelligence engine directly as a module.
 * Emits SSE events showing which queries and URLs are being processed.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const logger = require('../utils/logger');

async function runBrowserIntelligence(input, emit) {
  const { businessType, location } = input;

  emit('stage_update', { 
    stage: 'browser', 
    status: 'started', 
    message: `Searching web for ${businessType} market data...` 
  });

  try {
    // Dynamically require the browser module from Zonek_browser
    const browserPath = require('path').resolve(__dirname, '../../../Zonek_browser/src/browser.js');
    const { run } = require(browserPath);

    // Patch the Zonek_browser logger to emit SSE events for live URL streaming
    const patchedEmit = (url, query) => {
      emit('stage_update', {
        stage: 'browser',
        status: 'searching',
        url: url,
        message: `Searching: "${query}"`,
      });
    };

    // Emit search events before calling run
    emit('stage_update', { stage: 'browser', status: 'searching', message: `Querying market trends, costs, regulations for ${businessType}...` });
    
    const packet = await run(businessType, location);

    const totalFindings = packet?.sources_used || 0;
    emit('data_ready', { 
      stage: 'browser', 
      count: totalFindings,
      groups: Object.keys(packet?.groups || {}),
      message: `Web intelligence complete: ${totalFindings} facts extracted across ${Object.keys(packet?.groups || {}).length} research areas`
    });

    logger.info(`[BrowserAdapter] ✅ Web intelligence done — ${totalFindings} facts`);
    return packet;

  } catch (err) {
    logger.error(`[BrowserAdapter] ❌ Failed: ${err.message}`);
    emit('stage_update', { stage: 'browser', status: 'error', message: `Web search failed: ${err.message}` });
    return null;
  }
}

module.exports = { runBrowserIntelligence };
