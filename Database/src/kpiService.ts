import { prisma } from './db';
import { DocumentStatus, DocumentType } from '@prisma/client';

export async function getDashboardKPIs() {
  const [
    totalProductsInCatalog,
    stockLevels,
    pendingReceipts,
    pendingDeliveries,
    internalTransfersScheduled
  ] = await Promise.all([
    prisma.product.count(),
    
    // Fetch all stock levels across all locations to check for low/out of stock
    prisma.stockLevel.findMany(),
    
    // Pending Receipts (Status is not DONE or CANCELED)
    prisma.document.count({
      where: {
        type: DocumentType.RECEIPT,
        status: { notIn: [DocumentStatus.DONE, DocumentStatus.CANCELED] }
      }
    }),

    // Pending Deliveries
    prisma.document.count({
      where: {
        type: DocumentType.DELIVERY,
        status: { notIn: [DocumentStatus.DONE, DocumentStatus.CANCELED] }
      }
    }),

    // Scheduled Transfers
    prisma.document.count({
      where: {
        type: DocumentType.TRANSFER,
        status: { notIn: [DocumentStatus.DONE, DocumentStatus.CANCELED] }
      }
    })
  ]);

  // Calculate out of stock or low stock (assuming threshold is <= 5)
  let outOfStockCount = 0;
  let lowStockCount = 0;

  stockLevels.forEach((stock) => {
    if (stock.currentQuantity.lte(0)) {
      outOfStockCount++;
    } else if (stock.currentQuantity.lte(5)) {
      lowStockCount++;
    }
  });

  return {
    totalProductsInCatalog,
    outOfStockCount,
    lowStockCount,
    pendingReceipts,
    pendingDeliveries,
    internalTransfersScheduled
  };
}
