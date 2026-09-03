const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  // Support either MONGODB_URI (standard Atlas naming) or MONGO_URI
  let uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/waste_management_db';

  // Ensure target database name is explicitly included if connection string ends at domain
  if (uri.startsWith('mongodb+srv://') && !uri.includes('.mongodb.net/')) {
    uri = uri.replace('.mongodb.net', '.mongodb.net/waste_management_db?retryWrites=true&w=majority');
  }

  try {
    // Attempt connecting to the configured URI with a 5-second server selection timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    
    // Mask sensitive connection details for safe production / evaluation logging
    const host = mongoose.connection.host || 'remote-cluster';
    const dbName = mongoose.connection.name || 'waste_management_db';
    console.log(`[Database] MongoDB connected successfully | Host: ${host} | Database: ${dbName}`);
  } catch (err) {
    console.warn(`[Database] Warning: Failed to connect to external MongoDB: ${err.message}`);

    // If running in development and external database is unreachable, provide fallback
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
      console.log(`[Database] Initializing fallback in-memory MongoDB server for seamless offline development...`);

      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const memoryUri = mongodInstance.getUri();

        await mongoose.connect(memoryUri);
        console.log(`[Database] In-memory MongoDB connected successfully at fallback instance.`);
      } catch (memErr) {
        console.error(`[Database] Critical Error: Unable to start fallback in-memory MongoDB:`, memErr);
        process.exit(1);
      }
    } else {
      console.error(`[Database] Critical Error: Cannot establish connection to MongoDB:`, err.message);
      process.exit(1);
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error(`[Database] MongoDB connection error:`, err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn(`[Database] MongoDB disconnected.`);
  });
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error(`[Database] Error disconnecting:`, err.message);
  }
};

module.exports = { connectDB, disconnectDB };
