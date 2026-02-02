import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer | null = null;

// Set a dummy MONGODB_URI early to prevent module load errors
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

// Mock next/cache for integration tests
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
  headers: () => new Headers(),
}));

// Mock email service
vi.mock('@/lib/email', () => ({
  sendDemandeStatusEmail: vi.fn().mockResolvedValue({ success: true }),
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock Resend
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'test-email-id' }, error: null }),
    },
  })),
}));

// Setup MongoDB Memory Server before all tests
beforeAll(async () => {
  if (!mongod) {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);
  }
}, 60000);

// Cleanup after all tests
afterAll(async () => {
  if (mongod) {
    await mongoose.disconnect();
    await mongod.stop();
    mongod = null;
  }
});

// Clear collections after each test
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

// Mock connectDB to use the global memory server connection
vi.mock('@/lib/db/mongodb', async () => {
  return {
    default: async () => {
      if (mongoose.connection.readyState !== 1) {
        throw new Error('MongoDB not connected. Setup file should have established connection.');
      }
      return mongoose;
    },
  };
});

// Global test timeout
vi.setConfig({ testTimeout: 60000 });
