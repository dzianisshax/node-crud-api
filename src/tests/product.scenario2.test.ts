import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { ProductDTO, Product } from '../types/product.js';

describe('Product API - Scenario 2', () => {
  let app: FastifyInstance;
  let firstProductId: string;
  let secondProductId: string;

  beforeAll(async () => {
    app = buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. POST /api/products - Create first product with limited stock', async () => {
    const productPayload: ProductDTO = {
      name: 'Gaming Keyboard',
      description: 'Mechanical gaming keyboard',
      price: 129.99,
      category: 'Keyboards',
      inStock: true,
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      payload: productPayload,
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body).toHaveProperty('id');
    firstProductId = body.id;
  });

  it('2. POST /api/products - Create second product as out of stock', async () => {
    const productPayload: ProductDTO = {
      name: 'Wireless Headset',
      description: 'Premium wireless headset',
      price: 89.99,
      category: 'Audio',
      inStock: false,
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      payload: productPayload,
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body).toHaveProperty('id');
    expect(body.inStock).toBe(false);
    secondProductId = body.id;
  });

  it('3. GET /api/products - Verify both products exist with correct stock status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products',
    });

    expect(response.statusCode).toBe(200);
    const products = response.json() as Product[];
    expect(products).toHaveLength(2);

    const firstProduct = products.find((p) => p.id === firstProductId);
    const secondProduct = products.find((p) => p.id === secondProductId);

    expect(firstProduct?.inStock).toBe(true);
    expect(secondProduct?.inStock).toBe(false);
  });

  it('4. PUT /api/products/{productId} - Update out of stock product to in stock', async () => {
    const updatePayload: ProductDTO = {
      name: 'Wireless Headset',
      description: 'Premium wireless headset',
      price: 89.99,
      category: 'Audio',
      inStock: true,
    };

    const response = await app.inject({
      method: 'PUT',
      url: `/api/products/${secondProductId}`,
      payload: updatePayload,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.inStock).toBe(true);
    expect(body.id).toBe(secondProductId);
  });

  it('5. GET /api/products/{productId} - Verify stock status change persisted', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/products/${secondProductId}`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.inStock).toBe(true);
    expect(body.name).toBe('Wireless Headset');
  });

  it('6. DELETE /api/products/{productId} - Remove one product to test remaining inventory', async () => {
    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/api/products/${firstProductId}`,
    });

    expect(deleteResponse.statusCode).toBe(204);

    const getAllResponse = await app.inject({
      method: 'GET',
      url: '/api/products',
    });

    const products = getAllResponse.json();
    expect(products).toHaveLength(1);
    expect(products[0].id).toBe(secondProductId);
  });
});
