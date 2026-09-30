
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const MONGO_URI = process.env.MONGO_URI_BROWSER || 'mongodb://127.0.0.1:27017/zonek_browser';

async function fetchLastPacket() {
  const conn = await mongoose.createConnection(MONGO_URI).asPromise();
  const researchJobSchema = new mongoose.Schema({
    jobId: String,
    packet: mongoose.Schema.Types.Mixed,
    createdAt: Date,
  });
  const ResearchJob = conn.model('ResearchJob', researchJobSchema);
  
  const lastJob = await ResearchJob.findOne().sort({ createdAt: -1 });
  if (lastJob) {
    console.log(JSON.stringify(lastJob.packet, null, 2));
  } else {
    console.log('No jobs found');
  }
  await conn.close();
  process.exit(0);
}

fetchLastPacket();
