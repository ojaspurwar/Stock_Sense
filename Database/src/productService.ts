import { prisma } from './db';

interface CreateProductData {
  name: string;
  sku: string;
  category: string;
  unitOfMeasure: string;
}

/**
 * Creates a new product in the catalog.
 */
export async function createProduct(data: CreateProductData) {
  return await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      category: data.category,
      unitOfMeasure: data.unitOfMeasure,
    }
  });
}

/**
 * Fetches all products, optionally filtering by category or SKU.
 */
export async function getProducts(filters?: { category?: string; searchSku?: string }) {
  return await prisma.product.findMany({
    where: {
      ...(filters?.category ? { category: filters.category } : {}),
      ...(filters?.searchSku ? { sku: { contains: filters.searchSku, mode: 'insensitive' } } : {}),
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Retrieves the complete stock availability for a specific product across all locations.
 */
export async function getProductStockAvailability(productId: string) {
  return await prisma.stockLevel.findMany({
    where: { productId },
    include: {
      location: true
    }
  });
}
