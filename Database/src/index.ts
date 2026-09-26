// Export the Prisma Client Singleton
export { prisma } from './db';

// Export all the core services
export * from './inventoryService';
export * from './kpiService';
export * from './productService';
export * from './documentService';

// Export Types for the Backend Team
export type { User, Product, Location, Document, DocumentLine, StockLedger, StockLevel, Contact } from '@prisma/client';
export { DocumentType, DocumentStatus, Role, LocationType, ContactType } from '@prisma/client';
