const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://127.0.0.1:27017/zonek_gov';

async function checkCoimbatore() {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    const db = conn.connection.db;
    
    const weather = await db.collection('weather').findOne({ stationName: /Coimbatore/i });
    console.log('Weather for Coimbatore:', weather ? 'FOUND' : 'NOT FOUND');
    
    const jjm = await db.collection('jjmData').findOne({ district: /Coimbatore/i });
    console.log('JJM for Coimbatore:', jjm ? 'FOUND' : 'NOT FOUND');

    const pmay = await db.collection('pmayData').findOne({ district: /Coimbatore/i });
    console.log('PMAY for Coimbatore:', pmay ? 'FOUND' : 'NOT FOUND');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkCoimbatore();
