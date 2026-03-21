import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { ProductDTO, Product } from '../types/product.js';

describe('Product API - Scenario 4', () => {
  let app: FastifyInstance;
  let budgetProductId: string;
  let premiumProductId: string;
  let midRangeProductId: string;

  beforeAll(async () => {
    app = buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. POST /api/products - Create budget product with minimum price', async () => {
    const budgetProduct: ProductDTO = {
      name: 'Basic Mouse Pad',
      description: 'Standard cloth mouse pad',
      price: 4.99,
      category: 'Accessories',
      inStock: true,
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      payload: budgetProduct,
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body).toHaveProperty('id');
    expect(body.price).toBe(4.99);
    budgetProductId = body.id;
  });

  it('2. POST /api/products - Create premium product with high price', async () => {
    const premiumProduct: ProductDTO = {
      name: 'Gaming Monitor',
      description: '240Hz 4K Gaming Monitor',
      price: 899.99,
      category: 'Electronics',
      inStock: true,
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      payload: premiumProduct,
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body).toHaveProperty('id');
    expect(body.price).toBe(899.99);
    premiumProductId = body.id;
  });

  it('3. POST /api/products - Create mid-range product with standard price', async () => {
    const midRangeProduct: ProductDTO = {
      name: 'Wireless Earbuds',
      description: 'Noise cancelling earbuds',
      price: 149.99,
      category: 'Audio',
      inStock: true,
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      payload: midRangeProduct,
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body).toHaveProperty('id');
    expect(body.price).toBe(149.99);
    midRangeProductId = body.id;
  });

  it('4. PUT /api/products - Update product price with significant discount', async () => {
    // Apply discount to earbuds
    const discountPayload: ProductDTO = {
      name: 'Wireless Earbuds',
      description: 'Noise cancelling earbuds',
      price: 59.99,
      category: 'Audio',
      inStock: true,
    };

    const response = await app.inject({
      method: 'PUT',
      url: `/api/products/${midRangeProductId}`,
      payload: discountPayload,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.price).toBe(59.99);
    expect(body.name).toBe('Wireless Earbuds');
  });

  it('5. GET /api/products - Verify all products in different price ranges', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products',
    });

    expect(response.statusCode).toBe(200);
    const products = response.json() as Product[];

    // Find each product by ID and verify their prices
    const budgetProduct = products.find((p) => p.id === budgetProductId);
    const premiumProduct = products.find((p) => p.id === premiumProductId);
    const discountedProduct = products.find((p) => p.id === midRangeProductId);

    expect(budgetProduct?.price).toBeLessThan(10);
    expect(premiumProduct?.price).toBeGreaterThan(500);
    expect(discountedProduct?.price).toBeLessThan(100);
    expect(discountedProduct?.price).toBeGreaterThan(50);
  });

  it('6. PUT /api/products/{productId} - Test price update validation', async () => {
    // Attempt to update product with zero price (should be rejected by validation)
    const invalidUpdatePayload = { price: 0 };

    const invalidResponse = await app.inject({
      method: 'PUT',
      url: `/api/products/${budgetProductId}`,
      payload: invalidUpdatePayload,
    });

    // If validation exists, this should return 400 or similar
    expect([400]).toContain(invalidResponse.statusCode);

    // Verify the original product wasn't affected by invalid update
    const getResponse = await app.inject({
      method: 'GET',
      url: `/api/products/${budgetProductId}`,
    });

    const product = getResponse.json();
    expect(product.price).toBe(4.99); // Price should remain unchanged
  });
});
