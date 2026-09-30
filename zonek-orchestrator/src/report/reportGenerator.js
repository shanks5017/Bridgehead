'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const Groq   = require('groq-sdk');
const logger = require('../utils/logger');
const axios  = require('axios'); // For Ollama requests

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are Zonek Intelligence Engine — a deterministic business feasibility analyst for Indian entrepreneurs.

RULES (non-negotiable):
1. Use ONLY the data in [RAW DATA CONTEXT]. No training knowledge for numerical claims.
2. Every number must have a tag: VERIFIED | CALCULATED | ESTIMATED.
3. Source every verified claim (e.g. "source": "Rental Scraper").
4. Never say "conduct further research" or "explore alternatives" — always name a specific place, person, or action found in data or city context.
5. Every section MUST end with a single sentence "_verdict" field.
6. Output MUST be valid JSON matching the 00-07 schema exactly.
7. Scoring: GO=75-100, CAUTION=40-74, STOP=0-39.`;

async function generateReport(packet, retryCount = 0) {
  logger.info('[ReportGenerator] Generating dual-LLM feasibility report...');
  const context = buildContext(packet);
 
  try {
    // 1. Get a quick concise summary from Ollama (Privacy-First/Fast)
    let ollamaSummary = "Data analysis complete.";
    try {
      logger.info('[ReportGenerator] 🔒 Stage 1: Requesting concise summary from Ollama...');
      const ollamaPrompt = `Briefly summarize the feasibility of a ${packet.query.businessType} in ${packet.query.location} based on this data: ${JSON.stringify(context)}. Keep it under 100 words. Focus on the most critical risks.`;
      ollamaSummary = await callOllama("You are a concise business advisor.", ollamaPrompt);
    } catch (err) {
      logger.warn(`[ReportGenerator] ⚠️ Ollama skipped: ${err.message}`);
    }
 
    // 2. Get the full detailed JSON report from Groq (Deep Reasoning)
    const groqUserPrompt = `[RAW DATA CONTEXT]
${JSON.stringify(context, null, 2)}
 
[TASK] Generate a structured feasibility report for: ${packet.query.businessType} in ${packet.query.location}. 
Budget: ₹${(packet.query.budget_inr||0).toLocaleString('en-IN')}
 
Output EXACTLY this JSON structure:
{
  "00_verdict_bar": {
    "score": { "value": <int>, "tag": "CALCULATED", "logic": "..." },
    "label": "<GO|CAUTION|STOP>",
    "brutal_honesty": "One sentence, plain English, brutally honest explanation.",
    "_verdict": "..."
  },
  "01_money_reality": {
    "avg_rent": { "value": <int>, "tag": "VERIFIED", "source": "..." },
    "price_range": "₹MIN - ₹MAX",
    "budget_runway_months": { "value": <int>, "tag": "CALCULATED" },
    "cheaper_zones": [ { "area": "...", "est_rent": "₹X-Y", "reason": "..." } ],
    "_verdict": "..."
  },
  "02_competitor_landscape": {
    "density": { "radius_1km": <int>, "radius_3km": <int>, "radius_5km": <int> },
    "top_competitors": [ { "name": "...", "rating": "...", "price": "...", "usp": "..." } ],
    "gap_analysis": "Specific gap found in the market.",
    "_verdict": "..."
  },
  "03_demand_signals": {
    "zone_type": "...",
    "addressable_market": { "estimate": <int>, "calculation": "...", "tag": "ESTIMATED" },
    "search_trend": "...",
    "proximity_flags": { "colleges": "YES/NO", "offices": "YES/NO" },
    "_verdict": "..."
  },
  "04_startup_cost_reality": {
    "equipment": { "value": <int>, "tag": "ESTIMATED" },
    "deposit": { "value": <int>, "tag": "CALCULATED" },
    "interiors": { "value": <int>, "tag": "ESTIMATED" },
    "licensing": { "value": <int>, "tag": "ESTIMATED" },
    "total_setup_cost": { "value": <int>, "tag": "CALCULATED" },
    "budget_gap": { "value": <int>, "tag": "CALCULATED" },
    "breakeven_members": <int>,
    "_verdict": "..."
  },
  "05_govt_and_civic": {
    "civic_impact": "Translate raw water/infra % into business impact.",
    "schemes": [ { "name": "...", "max_amount": "...", "how_to_apply": "..." } ],
    "licenses": [ { "name": "...", "cost": "...", "where": "..." } ],
    "_verdict": "..."
  },
  "06_risk_register": [
    { "severity": "HIGH/MEDIUM/LOW", "title": "...", "description": "...", "mitigation": "SPECIFIC action", "cost": "..." }
  ],
  "07_final_verdict_and_action_plan": {
    "final_verdict": "<GO|CAUTION|STOP>",
    "action_plan": [ { "week": <1-4>, "task": "...", "detail": "..." } ],
    "alternatives_if_stop": [ { "business": "...", "reason": "..." } ],
    "data_confidence_pct": { "rental": "X%", "competitors": "X%", "demand": "X%", "costs": "X%", "civic": "X%" },
    "_verdict": "..."
  }
}`;
 
    const raw = await callGroq(SYSTEM_PROMPT, groqUserPrompt);
 
    let report;
    try { report = JSON.parse(raw); }
    catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) report = JSON.parse(match[0]);
      else throw new Error('Could not parse Groq response as JSON');
    }
 
    logger.info(`[ReportGenerator] ✅ Result: ${report['00_verdict_bar']?.label}, Score: ${report['00_verdict_bar']?.score?.value}`);
    return report;
 
  } catch (err) {
    if (err.status === 429 && retryCount < 2) {
      const wait = (retryCount + 1) * 8000;
      logger.warn(`[ReportGenerator] Rate limited — retrying in ${wait/1000}s`);
      await new Promise(r => setTimeout(r, wait));
      return generateReport(packet, retryCount + 1);
    }
    logger.error(`[ReportGenerator] ❌ ${err.message}`);
    return buildFallback(packet, err.message);
  }
}

async function callGroq(systemPrompt, userPrompt) {
  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt },
    ],
    model:           'llama-3.3-70b-versatile',
    temperature:     0.15,
    response_format: { type: 'json_object' },
  }, { timeout: 45000 });
  return completion.choices[0].message.content;
}

async function callOllama(systemPrompt, userPrompt, isJson = false) {
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/generate';
  const data = {
    model: 'qwen2.5',
    system: systemPrompt,
    prompt: userPrompt,
    stream: false,
    options: { temperature: 0.15 }
  };
  if (isJson) data.format = 'json';
  
  const response = await axios.post(OLLAMA_URL, data, { timeout: 60000 });
  return response.data.response;
}

function buildContext(packet) {
  const gov = packet.gov_data || {};
  return {
    QUERY: packet.query,
    RENTAL_DATA: {
      status: packet.rentals?.status,
      avg_rent: packet.rentals?.avg_rent_inr,
      range: `${packet.rentals?.min_rent_inr} - ${packet.rentals?.max_rent_inr}`,
      count: packet.rentals?.total,
      budget_analysis: packet.rentals?.budget_analysis,
      top_listings: (packet.rentals?.listings || []).slice(0, 5)
    },
    COMPETITOR_DATA: {
      status: packet.competitors?.status,
      count: packet.competitors?.count,
      top_competitors: (packet.competitors?.competitors || []).slice(0, 5)
    },
    CIVIC_DATA: {
      water_coverage: gov.jjm?.water_coverage_pct,
      housing_activity: gov.pmay?.sanctioned,
      infrastructure_news: gov.infrastructure_news?.recent
    },
    GOVT_SCHEMES: gov.schemes?.schemes,
    WEB_TRENDS: packet.web_intelligence?.groups
  };
}

function buildFallback(packet, msg) {
  return {
    "00_verdict_bar": { "score": { "value": 50, "tag": "ESTIMATED" }, "label": "CAUTION", "brutal_honesty": `System error: ${msg}`, "_verdict": "Report generated in failsafe mode." },
    "01_money_reality": { "avg_rent": { "value": packet.rentals?.avg_rent_inr || 0, "tag": "VERIFIED" }, "price_range": "Unknown", "budget_runway_months": { "value": 0, "tag": "CALCULATED" }, "cheaper_zones": [], "_verdict": "Rental data partial." },
    "02_competitor_landscape": { "density": { "radius_1km": 0, "radius_3km": 0, "radius_5km": 0 }, "top_competitors": [], "gap_analysis": "Data unavailable", "_verdict": "Competitor data partial." },
    "03_demand_signals": { "zone_type": "Unknown", "addressable_market": { "estimate": 0, "calculation": "N/A", "tag": "ESTIMATED" }, "search_trend": "Unknown", "proximity_flags": { "colleges": "UNKNOWN", "offices": "UNKNOWN" }, "_verdict": "Demand data partial." },
    "04_startup_cost_reality": { "equipment": { "value": 0, "tag": "ESTIMATED" }, "deposit": { "value": 0, "tag": "CALCULATED" }, "interiors": { "value": 0, "tag": "ESTIMATED" }, "licensing": { "value": 0, "tag": "ESTIMATED" }, "total_setup_cost": { "value": 0, "tag": "CALCULATED" }, "budget_gap": { "value": 0, "tag": "CALCULATED" }, "breakeven_members": 0, "_verdict": "Cost data partial." },
    "05_govt_and_civic": { "civic_impact": "Data unavailable", "schemes": [], "licenses": [], "_verdict": "Gov data partial." },
    "06_risk_register": [],
    "07_final_verdict_and_action_plan": { "final_verdict": "CAUTION", "action_plan": [], "alternatives_if_stop": [], "data_confidence_pct": {}, "_verdict": "Action plan unavailable." },
    "_fallback": true
  };
}

module.exports = { generateReport };
