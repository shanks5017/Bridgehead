'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors    = require('cors');
const { v4: uuidv4 } = require('uuid');
const logger  = require('./utils/logger');
const archiver = require('archiver');
const { runResearchPipeline } = require('./pipeline/orchestrator');
const { getResearchJobModel } = require('./models/ResearchJob');

const app  = express();
const PORT = process.env.PORT || 8002;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    services: {
      rental_scraper: process.env.RENTAL_API_URL,
      gov_db: process.env.MONGO_URI_GOV ? 'configured' : 'missing',
      groq: process.env.GROQ_API_KEY ? 'configured' : 'missing',
    },
    timestamp: new Date().toISOString(),
  });
});

// ── SSE Research Endpoint ─────────────────────────────────────────────────────
// This is the heart of the Perplexity-style live streaming experience.
// Each pipeline stage sends SSE events as it finds data, so the UI can
// show live URLs, counts, and status updates in real-time.
app.post('/api/v1/research', async (req, res) => {
  const { businessType, location, budget, spaceReq, businessFormat, targetCustomer, openToAlternate } = req.body;

  if (!businessType || !location) {
    return res.status(400).json({ error: 'businessType and location are required' });
  }

  const jobId = uuidv4();
  logger.info(`[Orchestrator] 🚀 New research job: ${jobId} — ${businessType} @ ${location}`);

  // ── Set up SSE connection ─────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable Nginx buffering
  res.flushHeaders();

  // Helper to send SSE events
  const emit = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Heartbeat to keep connection alive during long scrapes
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  try {
    const ResearchJob = getResearchJobModel();
    await ResearchJob.create({ jobId, input: { businessType, location, budget, spaceReq, businessFormat } });

    emit('pipeline_started', { 
      jobId, 
      businessType, 
      location, 
      budget,
      message: `Starting market intelligence analysis for ${businessType} in ${location}...`
    });

    const result = await runResearchPipeline(
      { businessType, location, budget, spaceReq, businessFormat, targetCustomer, openToAlternate },
      emit // SSE emitter passed to pipeline stages
    );

    // Save success to DB
    await ResearchJob.findOneAndUpdate(
      { jobId }, 
      { status: 'completed', packet: result.packet, report: result.report, completedAt: new Date() }
    );

    emit('report_ready', result);
    logger.info(`[Orchestrator] ✅ Job complete and cached: ${jobId}`);

  } catch (err) {
    logger.error(`[Orchestrator] ❌ Job failed: ${jobId} — ${err.message}`);
    const ResearchJob = getResearchJobModel();
    await ResearchJob.findOneAndUpdate({ jobId }, { status: 'failed', error: err.message, completedAt: new Date() });
    
    emit('error', { message: err.message || 'Pipeline failed unexpectedly' });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
});

// ── Export Endpoint ───────────────────────────────────────────────────────────
app.get('/api/v1/export/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const ResearchJob = getResearchJobModel();
    const job = await ResearchJob.findOne({ jobId });
    
    if (!job || !job.packet) {
      return res.status(404).json({ error: 'Job not found or not completed' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=Zonek_Research_${jobId}.zip`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    archive.append(JSON.stringify(job.report, null, 2), { name: 'Feasibility_Report.json' });
    archive.append(JSON.stringify(job.packet, null, 2), { name: 'Raw_Intelligence_Packet.json' });

    if (job.packet.rentals?.listings) {
      const csv = ['title,price,sqft,url'];
      job.packet.rentals.listings.forEach(l => csv.push(`"${l.title || ''}",${l.price || 0},${l.sqft || 0},"${l.url || ''}"`));
      archive.append(csv.join('\n'), { name: 'rental_listings.csv' });
    }

    if (job.packet.competitors?.competitors) {
      const csv = ['name,address,rating,reviews'];
      job.packet.competitors.competitors.forEach(c => csv.push(`"${c.name || ''}","${c.address || ''}",${c.rating || ''},${c.reviews || 0}`));
      archive.append(csv.join('\n'), { name: 'competitors.csv' });
    }

    await archive.finalize();
  } catch (error) {
    logger.error(`[Export] ❌ Error exporting job: ${error.message}`);
    res.status(500).json({ error: 'Failed to generate export' });
  }
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🟢 Zonek Orchestrator running on http://localhost:${PORT}`);
  logger.info(`   Health: http://localhost:${PORT}/api/v1/health`);
  logger.info(`   Research: POST http://localhost:${PORT}/api/v1/research`);
});

module.exports = app;
