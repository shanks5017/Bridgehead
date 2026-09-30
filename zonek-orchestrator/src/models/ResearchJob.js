'use strict';
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MONGO_URI = process.env.MONGO_URI_BROWSER || 'mongodb://127.0.0.1:27017/zonek_browser';

let db = null;
function getDB() {
  if (db) return db;
  db = mongoose.createConnection(MONGO_URI, { maxPoolSize: 5 });
  logger.info('[DB] Connected to Zonek_browser MongoDB for caching Research Jobs');
  return db;
}

const researchJobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true },
  input: {
    businessType: String,
    location: String,
    budget: Number,
    spaceReq: String,
    businessFormat: String,
  },
  status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
  packet: mongoose.Schema.Types.Mixed,
  report: mongoose.Schema.Types.Mixed,
  error: String,
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
});

function getResearchJobModel() {
  const conn = getDB();
  return conn.model('ResearchJob', researchJobSchema);
}

module.exports = { getResearchJobModel };
