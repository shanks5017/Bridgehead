import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zonek';

async function checkChennai() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const countList = await db.collection('Chennai_List').countDocuments({ status: 'active' });
    const countAds = await db.collection('Chennai_ads').countDocuments({});
    console.log(`Chennai List: ${countList}`);
    console.log(`Chennai Ads: ${countAds}`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

checkChennai();
