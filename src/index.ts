import Fastify from 'fastify';
import { productRoutes } from './routes/product.routes.js';

const startServer = async () => {
  const fastify = Fastify({
    logger: true,
  });

  fastify.register(productRoutes, { prefix: '/api' });

  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log(`Server listening at http://localhost:3000`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

startServer();
