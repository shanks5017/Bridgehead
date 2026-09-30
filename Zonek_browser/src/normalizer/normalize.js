'use strict';
const crypto = require('crypto');

/**
 * NORMALIZER
 * Aggregates group results into the final Browser Intelligence Packet.
 */

function generateQueryHash(businessType, location) {
  const today = new Date().toISOString().split('T')[0]; // Fresh every day
  const raw = `${businessType.toLowerCase()}|${location.toLowerCase()}|${today}`;
  return crypto.createHash('md5').update(raw).digest('hex');
}

/**
 * Merges raw group results into the structured packet format.
 */
function createIntelligencePacket(businessType, location, groupResults) {
  const packet = {
    query_id: `${businessType.toLowerCase()}_${location.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    generated_at: new Date().toISOString(),
    groups: {},
    overall_confidence: "MEDIUM",
    sources_checked: 0,
    sources_used: 0
  };

  let totalFindings = 0;

  for (const [groupId, result] of Object.entries(groupResults)) {
    const findings = result.findings || [];
    packet.groups[groupId] = {
      label: result.label,
      confidence: findings.length >= 3 ? "HIGH" : (findings.length > 0 ? "MEDIUM" : "LOW"),
      findings: findings
    };
    
    packet.sources_checked += result.sourcesChecked || 0;
    packet.sources_used += findings.length;
    totalFindings += findings.length;
  }

  if (totalFindings >= 10) packet.overall_confidence = "HIGH";
  else if (totalFindings === 0) packet.overall_confidence = "UNAVAILABLE";

  return packet;
}

module.exports = { generateQueryHash, createIntelligencePacket };
