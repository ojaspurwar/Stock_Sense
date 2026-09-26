import { prisma } from './db';
import { DocumentType, DocumentStatus, Prisma } from '@prisma/client';

interface CreateDocumentData {
  type: DocumentType;
  createdBy: string;
  contactId?: string; // Supplier for Receipts, Customer for Deliveries
  sourceLocationId?: string;
  destinationLocationId?: string;
  items: Array<{
    productId: string;
    requestedQuantity: number;
  }>;
}

/**
 * Creates a new Draft Document (Receipt, Delivery, Transfer, Adjustment)
 * along with its requested Document Lines.
 */
export async function createDocument(data: CreateDocumentData) {
  return await prisma.document.create({
    data: {
      type: data.type,
      status: DocumentStatus.DRAFT,
      createdBy: data.createdBy,
      contactId: data.contactId,
      sourceLocationId: data.sourceLocationId,
      destinationLocationId: data.destinationLocationId,
      lines: {
        create: data.items.map(item => ({
          productId: item.productId,
          requestedQuantity: new Prisma.Decimal(item.requestedQuantity)
        }))
      }
    },
    include: {
      lines: true
    }
  });
}

/**
 * Updates a document's status (e.g., from DRAFT to WAITING or READY).
 * Note: To mark as DONE, you MUST use `inventoryService.validateDocument` instead, 
 * as that processes the actual ledger entries.
 */
export async function updateDocumentStatus(documentId: string, status: DocumentStatus) {
  if (status === DocumentStatus.DONE) {
    throw new Error("Use inventoryService.validateDocument to mark a document as DONE.");
  }

  return await prisma.document.update({
    where: { id: documentId },
    data: { status }
  });
}

/**
 * Fetches documents based on dynamic filters (as requested in the PDF)
 */
export async function getDocuments(filters?: {
  type?: DocumentType;
  status?: DocumentStatus;
  locationId?: string;
}) {
  return await prisma.document.findMany({
    where: {
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      // If location is provided, check if it's either the source or destination
      ...(filters?.locationId ? {
        OR: [
          { sourceLocationId: filters.locationId },
          { destinationLocationId: filters.locationId }
        ]
      } : {})
    },
    include: {
      contact: true,
      sourceLocation: true,
      destinationLocation: true,
      lines: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}
