import { FastifyInstance } from 'fastify';
import * as productController from '../controllers/product.controller.js';

export async function productRoutes(fastify: FastifyInstance) {
  const paramsIdSchema = {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
    required: ['id'],
  };

  const productProperties = {
    name: { type: 'string' },
    description: { type: 'string' },
    price: { type: 'number', exclusiveMinimum: 0 },
    category: { type: 'string' },
    inStock: { type: 'boolean' },
  };

  const productSchema = {
    body: {
      type: 'object',
      required: ['name', 'description', 'price', 'category', 'inStock'],
      properties: productProperties,
      additionalProperties: false,
    },
  };

  fastify.get('/products', {
    handler: productController.getAllProducts,
  });

  fastify.get('/products/:id', {
    schema: { params: paramsIdSchema },
    handler: productController.getProductById,
  });

  fastify.post('/products', {
    schema: productSchema,
    handler: productController.createProduct,
  });

  fastify.put('/products/:id', {
    schema: productSchema,
    handler: productController.updateProduct,
  });

  fastify.delete('/products/:id', {
    schema: { params: paramsIdSchema },
    handler: productController.deleteProduct,
  });
}
