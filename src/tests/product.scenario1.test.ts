import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateProductDTO } from '../types/product.js';

describe('Product API - Scenario 1', () => {
  let app: FastifyInstance;
  let createdProductId: string;

  // Setup the Fastify instance before the tests run
  beforeAll(async () => {
    app = buildApp();
  });

  // Clean up after all tests are done
  afterAll(async () => {
    await app.close();
  });

  it('1. GET /api/products -> an empty array is expected', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it('2. POST /api/products -> expects a new object to be created', async () => {
    const newProductPayload: CreateProductDTO = {
      name: 'Wireless Mouse',
      description: 'Wireless',
      price: 45,
      category: 'Mouse',
      inStock: true,
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      payload: newProductPayload,
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();
    expect(body).toHaveProperty('id');
    expect(body.name).toBe(newProductPayload.name);
    expect(body.price).toBe(newProductPayload.price);

    // Save the ID for the next steps
    createdProductId = body.id;
  });

  it('3. GET /api/products/{productId} -> expects the created record', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/products/${createdProductId}`,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.id).toBe(createdProductId);
    expect(body.name).toBe('Wireless Mouse');
  });

  it('4. PUT /api/products/{productId} -> expects an updated object with the same id', async () => {
    const updatedPayload = { name: 'Wireless Mouse Pro', price: 65 };

    const response = await app.inject({
      method: 'PUT',
      url: `/api/products/${createdProductId}`,
      payload: updatedPayload,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    // ID remains the same
    expect(body.id).toBe(createdProductId);
    expect(body.name).toBe(updatedPayload.name);
    expect(body.price).toBe(updatedPayload.price);
  });

  it('5. DELETE /api/products/{productId} -> expects confirmation of successful deletion', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/products/${createdProductId}`,
    });

    expect([204]).toContain(response.statusCode);
  });

  it('6. GET /api/products/{productId} -> expects that there is no such object', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/products/${createdProductId}`,
    });

    expect(response.statusCode).toBe(404);
  });
});
