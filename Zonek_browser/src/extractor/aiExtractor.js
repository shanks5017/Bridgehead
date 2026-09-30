'use strict';
/**
 * AI EXTRACTOR
 * Uses Groq (llama-3.1-8b-instant) to extract structured facts from page content.
 */

const Groq = require('groq-sdk');
const logger = require('../utils/logger');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Delay tracker to stay under rate limits
let lastCallTime = 0;

/**
 * Extract structured facts from raw markdown content.
 */
async function extractFacts(content, groupLabel, businessType, location, retryCount = 0) {
  if (!content || content.length < 100) return [];

  // Sequential delay: ensure at least 1s between calls
  const now = Date.now();
  const waitTime = Math.max(0, 1000 - (now - lastCallTime));
  if (waitTime > 0) await new Promise(r => setTimeout(r, waitTime));
  lastCallTime = Date.now();

  try {
    const prompt = `
      You are an expert business research assistant for Zonek Intelligence.
      
      TASK:
      Extract at most 3 clear, specific, and verifiable facts from the provided text below.
      The facts must be related to the business category: "${businessType}" in the location: "${location}".
      Focus on the context of: "${groupLabel}".

      RULES:
      1. Every fact must be exactly one sentence.
      2. No generalities. Use specific numbers, trends, or names if available.
      3. If no relevant facts exist, the facts array should be empty.
      4. Output MUST be a valid JSON object with a single key "facts" which is an array of strings.
      5. Example format: {"facts": ["Fact one here.", "Fact two here."]}
      6. Do not hallucinate or add knowledge from outside the text.

      TEXT:
      ${content.substring(0, 3000)}

      JSON OUTPUT:
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    }, { timeout: 30000 });

    const rawContent = chatCompletion.choices[0].message.content;
    const resp = JSON.parse(rawContent);
    
    // Robust extraction: find the first array in the JSON response
    let facts = resp.facts || resp.findings || resp.results || [];
    
    if (!Array.isArray(facts)) {
      // If it's an object, find the first property that is an array
      const possibleArray = Object.values(resp).find(v => Array.isArray(v));
      facts = possibleArray || [];
    }
    
    return facts.map(f => String(f).trim()).filter(f => f.length > 5);
  } catch (err) {
    if (err.status === 429 && retryCount < 3) {
      const wait = Math.pow(2, retryCount) * 2000 + Math.random() * 1000;
      logger.warn(`[AI Extractor] Rate limited. Retrying in ${Math.round(wait)}ms...`);
      await new Promise(r => setTimeout(r, wait));
      return extractFacts(content, groupLabel, businessType, location, retryCount + 1);
    }
    logger.warn(`[AI Extractor] Failed to extract facts: ${err.message}`);
    return [];
  }
}

module.exports = { extractFacts };
