import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { Product } from '../types/product.js';

describe('Product API - Scenario 3', () => {
  let app: FastifyInstance;
  const createdProducts: string[] = [];

  beforeAll(async () => {
    app = buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. POST /api/products - Create multiple products in Electronics category', async () => {
    const electronicsProducts = [
      {
        name: 'Smart TV',
        description: '4K Smart TV',
        price: 599.99,
        category: 'Electronics',
        inStock: true,
      },
      {
        name: 'Bluetooth Speaker',
        description: 'Portable speaker',
        price: 79.99,
        category: 'Electronics',
        inStock: true,
      },
      {
        name: 'Tablet',
        description: '10-inch tablet',
        price: 299.99,
        category: 'Electronics',
        inStock: false,
      },
    ];

    for (const product of electronicsProducts) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: product,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      createdProducts.push(body.id);
    }
  });

  it('2. POST /api/products - Create products in Accessories category', async () => {
    const accessoriesProducts = [
      {
        name: 'Phone Case',
        description: 'Silicone case',
        price: 19.99,
        category: 'Accessories',
        inStock: true,
      },
      {
        name: 'Screen Protector',
        description: 'Tempered glass',
        price: 12.99,
        category: 'Accessories',
        inStock: true,
      },
    ];

    for (const product of accessoriesProducts) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: product,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      createdProducts.push(body.id);
    }
  });

  it('3. GET /api/products - Verify total product count', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products',
    });

    expect(response.statusCode).toBe(200);
    const products = response.json();
    expect(products).toHaveLength(5);
  });

  it('4. PUT /api/products/{productId} - Update multiple products with category-wide price increase', async () => {
    // Get all products to identify electronics category products
    const getAllResponse = await app.inject({
      method: 'GET',
      url: '/api/products',
    });

    const allProducts = getAllResponse.json() as Product[];
    const electronicsProducts = allProducts.filter(
      (p) => p.category === 'Electronics'
    );

    // Update each electronics product with 10% price increase
    for (const product of electronicsProducts) {
      const updatedPrice = product.price * 1.1;
      const updateResponse = await app.inject({
        method: 'PUT',
        url: `/api/products/${product.id}`,
        payload: { ...product, price: Number(updatedPrice.toFixed(2)) },
      });

      expect(updateResponse.statusCode).toBe(200);
      const updatedProduct = updateResponse.json();
      expect(updatedProduct.price).toBeCloseTo(product.price * 1.1, 1);
    }
  });

  it('5. GET /api/products - Verify category-specific updates persisted', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products',
    });

    expect(response.statusCode).toBe(200);
    const products = response.json() as Product[];

    const electronicsProducts = products.filter(
      (p) => p.category === 'Electronics'
    );
    const accessoriesProducts = products.filter(
      (p) => p.category === 'Accessories'
    );

    // Verify electronics products have updated prices
    electronicsProducts.forEach((product) => {
      if (product.name === 'Smart TV')
        expect(product.price).toBeCloseTo(659.99, 1);
      if (product.name === 'Bluetooth Speaker')
        expect(product.price).toBeCloseTo(87.99, 1);
      if (product.name === 'Tablet')
        expect(product.price).toBeCloseTo(329.99, 1);
    });

    // Verify accessories products have unchanged prices
    accessoriesProducts.forEach((product) => {
      if (product.name === 'Phone Case') expect(product.price).toBe(19.99);
      if (product.name === 'Screen Protector')
        expect(product.price).toBe(12.99);
    });
  });

  it('6. DELETE /api/products - Remove all out of stock products', async () => {
    // Get all products and identify out of stock items
    const getAllResponse = await app.inject({
      method: 'GET',
      url: '/api/products',
    });

    const allProducts = getAllResponse.json() as Product[];
    const outOfStockProducts = allProducts.filter((p) => p.inStock === false);

    // Delete all out of stock products
    for (const product of outOfStockProducts) {
      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: `/api/products/${product.id}`,
      });
      expect(deleteResponse.statusCode).toBe(204);
    }

    // Verify remaining products are all in stock
    const finalResponse = await app.inject({
      method: 'GET',
      url: '/api/products',
    });

    const remainingProducts = finalResponse.json() as Product[];
    expect(remainingProducts.every((p) => p.inStock === true)).toBe(true);
    expect(remainingProducts.length).toBe(4); // 5 total - 1 out of stock
  });
});
