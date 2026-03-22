import { Product, ProductDTO } from '../types/product.js';
import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';

interface Operation {
  id: string;
  type: 'create' | 'update' | 'delete';
  timestamp: number;
  data: any;
  productId?: string;
}

class ProductStore extends EventEmitter {
  private products: Map<string, Product> = new Map();
  private operations: Operation[] = [];
  private operationLog: Operation[] = [];
  private lastSyncTimestamp: number = 0;
  private isSyncing: boolean = false;

  constructor() {
    super();
    // Set max listeners to avoid warning
    this.setMaxListeners(100);
  }

  findAll(): Product[] {
    return Array.from(this.products.values());
  }

  findById(id: string): Product | undefined {
    return this.products.get(id);
  }

  create(data: ProductDTO): Product {
    const newProduct: Product = {
      id: randomUUID(),
      ...data,
    };

    this.products.set(newProduct.id, newProduct);

    // Record the operation
    const operation: Operation = {
      id: randomUUID(),
      type: 'create',
      timestamp: Date.now(),
      data: newProduct,
      productId: newProduct.id,
    };

    this.addOperation(operation);
    this.emit('operation', operation);

    return newProduct;
  }

  update(id: string, data: ProductDTO): Product | undefined {
    const existing = this.products.get(id);
    if (!existing) return undefined;

    const updatedProduct: Product = {
      ...existing,
      ...data,
    };
    this.products.set(id, updatedProduct);

    // Record the operation
    const operation: Operation = {
      id: randomUUID(),
      type: 'update',
      timestamp: Date.now(),
      data: { id, updates: data, result: updatedProduct },
      productId: id,
    };

    this.addOperation(operation);
    this.emit('operation', operation);

    return updatedProduct;
  }

  delete(id: string): boolean {
    const existing = this.products.get(id);
    if (!existing) return false;

    const deleted = this.products.delete(id);

    if (deleted) {
      // Record the operation
      const operation: Operation = {
        id: randomUUID(),
        type: 'delete',
        timestamp: Date.now(),
        data: { id, product: existing },
        productId: id,
      };

      this.addOperation(operation);
      this.emit('operation', operation);
    }

    return deleted;
  }

  private addOperation(operation: Operation) {
    this.operations.push(operation);
    this.operationLog.push(operation);

    // Keep only last 1000 operations for sync
    if (this.operations.length > 1000) {
      this.operations.shift();
    }

    // Keep operation log for debugging
    if (this.operationLog.length > 10000) {
      this.operationLog = this.operationLog.slice(-5000);
    }
  }

  // Get operations since a specific timestamp
  getOperationsSince(timestamp: number): Operation[] {
    return this.operations.filter((op) => op.timestamp > timestamp);
  }

  // Get all recent operations (for initial sync)
  getAllOperations(): Operation[] {
    return [...this.operations];
  }

  // Sync operations from another worker
  syncOperations(operations: Operation[]): void {
    if (this.isSyncing || operations.length === 0) return;

    this.isSyncing = true;

    try {
      // Sort operations by timestamp
      const sortedOps = [...operations].sort(
        (a, b) => a.timestamp - b.timestamp
      );

      for (const operation of sortedOps) {
        // Skip if this operation is already applied (by checking timestamp)
        if (operation.timestamp <= this.lastSyncTimestamp) {
          continue;
        }

        this.applyOperation(operation);
        this.lastSyncTimestamp = Math.max(
          this.lastSyncTimestamp,
          operation.timestamp
        );
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private applyOperation(operation: Operation): void {
    switch (operation.type) {
      case 'create':
        // Only apply if product doesn't exist
        if (!this.products.has(operation.productId!)) {
          this.products.set(operation.productId!, operation.data);
          console.log(`Synced: Created product ${operation.productId}`);
        }
        break;

      case 'update':
        // Apply update if product exists
        if (this.products.has(operation.productId!)) {
          const current = this.products.get(operation.productId!)!;
          const updated = { ...current, ...operation.data.updates };
          this.products.set(operation.productId!, updated);
          console.log(`Synced: Updated product ${operation.productId}`);
        } else {
          // If product doesn't exist, we might need to request full sync
          console.warn(
            `Cannot update non-existent product ${operation.productId}`
          );
        }
        break;

      case 'delete':
        // Delete if product exists
        if (this.products.has(operation.productId!)) {
          this.products.delete(operation.productId!);
          console.log(`Synced: Deleted product ${operation.productId}`);
        }
        break;
    }
  }

  // Get current state for full sync
  getFullState(): { products: Product[]; lastSyncTimestamp: number } {
    return {
      products: Array.from(this.products.values()),
      lastSyncTimestamp: this.lastSyncTimestamp,
    };
  }

  // Full state replacement (used when worker is out of sync)
  fullSync(products: Product[]): void {
    this.isSyncing = true;
    try {
      this.products.clear();
      products.forEach((product) => {
        this.products.set(product.id, product);
      });
      console.log(`Full sync completed: ${products.length} products loaded`);
    } finally {
      this.isSyncing = false;
    }
  }

  // Get current sync status
  getSyncStatus(): {
    operationCount: number;
    lastSyncTimestamp: number;
    productCount: number;
  } {
    return {
      operationCount: this.operations.length,
      lastSyncTimestamp: this.lastSyncTimestamp,
      productCount: this.products.size,
    };
  }

  // Clear all data
  clear(): void {
    this.products.clear();
    this.operations = [];
    this.lastSyncTimestamp = 0;
  }
}

export const productStore = new ProductStore();
