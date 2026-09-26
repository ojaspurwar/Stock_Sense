import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development (especially important if using Next.js/Serverless)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
