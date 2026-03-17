import Fastify from 'fastify';
import { productRoutes } from './routes/product.routes.js';

const startServer = async () => {
  const fastify = Fastify({
    logger: true,
  });

  fastify.register(productRoutes, { prefix: '/api' });

  const port: number = Number(process.env.PORT) || 3000;

  try {
    await fastify.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

startServer();
