import mongoose, { Connection, ConnectOptions } from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const options: ConnectOptions = {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
    };

    const conn = await mongoose.connect(mongoURI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Connection event listeners
    const handleConnection = (event: string) => {
      return () => console.log(`Mongoose ${event} to DB`);
    };

    mongoose.connection.on('connected', handleConnection('connected'));

    mongoose.connection.on('error', (err: Error) => {
      console.error('Mongoose connection error:', err.message);
    });

    mongoose.connection.on('disconnected', handleConnection('disconnected'));

    // Close the Mongoose connection when the Node process ends
    const gracefulShutdown = async (signal: string) => {
      await mongoose.connection.close();
      console.log(`Mongoose disconnected through ${signal}`);
      process.exit(0);
    };

    // For nodemon restarts
    process.once('SIGUSR2', () => {
      gracefulShutdown('nodemon restart')
        .then(() => process.kill(process.pid, 'SIGUSR2'));
    });

    // For app termination
    process.on('SIGINT', () => gracefulShutdown('app termination'));
    process.on('SIGTERM', () => gracefulShutdown('app termination'));

  } catch (error) {
    console.error('❌ MongoDB connection error:', error instanceof Error ? error.message : 'Unknown error');
    // Exit process with failure
    process.exit(1);
  }
};

