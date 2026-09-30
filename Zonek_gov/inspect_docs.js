const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://127.0.0.1:27017/zonek_gov';

async function inspectDoc() {
  try {
    await mongoose.connect(MONGO_URI);
    const jjm = await mongoose.connection.db.collection('jjmData').findOne({});
    console.log('Sample JJM doc:', JSON.stringify(jjm, null, 2));
    
    const pmay = await mongoose.connection.db.collection('pmayData').findOne({});
    console.log('Sample PMAY doc:', JSON.stringify(pmay, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspectDoc();
