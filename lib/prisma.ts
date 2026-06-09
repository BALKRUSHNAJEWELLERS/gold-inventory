import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function makePrismaClient(): PrismaClient {
  const raw = process.env.DATABASE_URL;

  if (!raw) {
    throw new Error('DATABASE_URL environment variable is not set in .env');
  }

  // Normalize: strip any Prisma-specific prefixes → plain postgresql://
  const connectionString = raw
    .replace(/^prisma\+postgres:\/\//, 'postgresql://')
    .replace(/^prisma:\/\//, 'postgresql://')
    .replace(/^postgres:\/\//, 'postgresql://');

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
