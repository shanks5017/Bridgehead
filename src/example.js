const { connectToDatabase, closeConnection } = require('./config/db');

async function testConnection() {
  try {
    const db = await connectToDatabase();
    
    // Example: Test the connection by pinging the database
    await db.command({ ping: 1 });
    console.log('Successfully connected to MongoDB!');
    
    // Example: List all collections in the database
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('Database operation failed:', error);
  } finally {
    // Close the connection when done (in a real app, you might want to keep it open)
    await closeConnection();
  }
}

testConnection().catch(console.error);
