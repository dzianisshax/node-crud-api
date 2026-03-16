import {
  Product,
  CreateProductDTO,
  UpdateProductDTO,
} from '../types/product.js';
import { randomUUID } from 'crypto';

class ProductStore {
  private products: Map<string, Product> = new Map();

  findAll(): Product[] {
    return Array.from(this.products.values());
  }

  findById(id: string): Product | undefined {
    return this.products.get(id);
  }

  create(data: CreateProductDTO): Product {
    const newProduct: Product = {
      id: randomUUID(),
      ...data,
    };
    this.products.set(newProduct.id, newProduct);
    return newProduct;
  }

  update(id: string, data: UpdateProductDTO): Product | undefined {
    const existing = this.products.get(id);
    if (!existing) return undefined;

    const updatedProduct = { ...existing, ...data };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  delete(id: string): boolean {
    return this.products.delete(id);
  }
}

export const productStore = new ProductStore();
