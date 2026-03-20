import Fastify, { FastifyInstance } from 'fastify';
import { productRoutes } from './routes/product.routes.js';

export const buildApp = (): FastifyInstance => {
  const fastify = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  fastify.register(productRoutes, { prefix: '/api' });

  return fastify;
};
