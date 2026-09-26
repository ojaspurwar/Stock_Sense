import { prisma } from './db';
import { DocumentType, DocumentStatus, Prisma } from '@prisma/client';

/**
 * Validates and processes an inventory document (Receipt, Delivery, Transfer).
 * This uses an ACID-compliant transaction to ensure the Ledger and Stock Levels stay perfectly in sync.
 */
export async function validateDocument(documentId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch the document and its requested items (lines)
    const doc = await tx.document.findUnique({
      where: { id: documentId },
      include: { lines: true },
    });

    if (!doc) throw new Error("Document not found");
    if (doc.status === DocumentStatus.DONE) throw new Error("Document is already processed");

    // 2. Loop through each line item to create ledger entries and update stock caches
    for (const line of doc.lines) {
      const quantity = line.requestedQuantity;

      // Handle the Stock Ledger Entry (The Immutable Source of Truth)
      await tx.stockLedger.create({
        data: {
          documentId: doc.id,
          productId: line.productId,
          quantity: quantity,
        }
      });

      // Update the Materialized Stock Level Cache
      // Using upsert to either create the cache row or update it
      if (doc.type === DocumentType.RECEIPT && doc.destinationLocationId) {
        // Receipts ADD stock to destination
        await upsertStockLevel(tx, line.productId, doc.destinationLocationId, quantity);
      } 
      else if (doc.type === DocumentType.DELIVERY && doc.sourceLocationId) {
        // Deliveries SUBTRACT stock from source
        await upsertStockLevel(tx, line.productId, doc.sourceLocationId, new Prisma.Decimal(quantity.toNumber() * -1));
      } 
      else if (doc.type === DocumentType.TRANSFER && doc.sourceLocationId && doc.destinationLocationId) {
        // Transfers SUBTRACT from source and ADD to destination
        await upsertStockLevel(tx, line.productId, doc.sourceLocationId, new Prisma.Decimal(quantity.toNumber() * -1));
        await upsertStockLevel(tx, line.productId, doc.destinationLocationId, quantity);
      }
      else if (doc.type === DocumentType.ADJUSTMENT && doc.sourceLocationId) {
         // Adjustments apply the difference directly to the location
         await upsertStockLevel(tx, line.productId, doc.sourceLocationId, quantity);
      }

      // Mark the line as processed
      await tx.documentLine.update({
        where: { id: line.id },
        data: { processedQuantity: quantity }
      });
    }

    // 3. Mark the document as Done
    return await tx.document.update({
      where: { id: doc.id },
      data: { status: DocumentStatus.DONE }
    });
  });
}

/**
 * Helper function to safely update the StockLevel cache table
 */
async function upsertStockLevel(tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"> | Prisma.TransactionClient, productId: string, locationId: string, quantityChange: Prisma.Decimal) {
  const existing = await tx.stockLevel.findUnique({
    where: { productId_locationId: { productId, locationId } }
  });

  if (existing) {
    await tx.stockLevel.update({
      where: { productId_locationId: { productId, locationId } },
      data: { currentQuantity: existing.currentQuantity.add(quantityChange) }
    });
  } else {
    await tx.stockLevel.create({
      data: {
        productId,
        locationId,
        currentQuantity: quantityChange
      }
    });
  }
}
