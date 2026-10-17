import mongoose from 'mongoose';

/**
 * Connect to MongoDB safely using MONGODB_URI from environment variables.
 * Handles events and suppresses sensitive credential logging.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
    const err = new Error(
      'MONGODB_URI is not properly configured in server/.env. Please provide a valid MongoDB connection string.'
    );
    err.statusCode = 500;
    console.error(`[MongoDB Error] ${err.message}`);
    throw err;
  }

  // Set up connection event listeners once
  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB Error]', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB Disconnected] Connection closed.');
  });

  try {
    await mongoose.connect(uri);
    // Log safely without revealing credentials
    console.log(
      `[MongoDB Connected] Host: ${mongoose.connection.host || 'cluster'} | Database: ${mongoose.connection.name}`
    );
  } catch (connErr) {
    console.error(`[MongoDB Connection Error] Failed to connect: ${connErr.message}`);
    throw connErr;
  }
}
