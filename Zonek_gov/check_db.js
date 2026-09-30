const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://127.0.0.1:27017/zonek_gov';

async function checkData() {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Collections in zonek_gov:', collections.map(c => c.name));
    
    for (const coll of ['weather', 'schemes', 'jjmData', 'pmayData', 'cropPrices']) {
      const count = await conn.connection.db.collection(coll).countDocuments();
      console.log(`- ${coll}: ${count} documents`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
