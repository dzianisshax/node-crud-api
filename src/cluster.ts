import cluster from 'cluster';
import os from 'os';
import http from 'http';
import { buildApp } from './app.js';
import { productStore } from './store/product.store.js';

const numWorkers = Math.max(1, os.cpus().length - 1);
const basePort = parseInt(process.env.PORT || '3000');

interface WorkerInfo {
  id: number;
  port: number;
  worker: cluster.Worker;
  lastSyncTimestamp: number;
  isHealthy: boolean;
}

// Store for operations from all workers (in primary)
const globalOperationLog: any[] = [];

if (cluster.isPrimary) {
  console.log(`Primary process ${process.pid} is running`);
  console.log(`Starting ${numWorkers} workers...`);

  const workers: WorkerInfo[] = [];
  let currentWorkerIndex = 0;

  // Create workers
  for (let i = 0; i < numWorkers; i++) {
    const workerPort = basePort + i + 1;
    const worker = cluster.fork({
      WORKER_ID: i,
      WORKER_PORT: workerPort,
      IS_WORKER: 'true',
    });

    workers.push({
      id: i,
      port: workerPort,
      worker,
      lastSyncTimestamp: 0,
      isHealthy: true,
    });

    console.log(`Worker ${i} started on port ${workerPort}`);
  }

  // Broadcast operations to all workers
  function broadcastOperation(operation: any) {
    globalOperationLog.push(operation);

    // Keep only last 1000 operations
    if (globalOperationLog.length > 1000) {
      globalOperationLog.shift();
    }

    workers.forEach((workerInfo) => {
      if (workerInfo.worker.isConnected()) {
        workerInfo.worker.send({
          type: 'sync_operation',
          operation,
        });
      }
    });
  }

  // Handle worker messages
  workers.forEach((workerInfo) => {
    workerInfo.worker.on('message', (message) => {
      if (message.type === 'operation') {
        // Broadcast operation to all workers
        broadcastOperation(message.operation);
      } else if (message.type === 'sync_request') {
        // Send missing operations to worker
        const missingOps = globalOperationLog.filter(
          (op) => op.timestamp > workerInfo.lastSyncTimestamp
        );

        if (missingOps.length > 0) {
          workerInfo.worker.send({
            type: 'sync_response',
            operations: missingOps,
          });
          workerInfo.lastSyncTimestamp = Math.max(
            workerInfo.lastSyncTimestamp,
            ...missingOps.map((op) => op.timestamp)
          );
        }
      } else if (message.type === 'full_sync_request') {
        // Worker needs full sync
        workerInfo.worker.send({
          type: 'full_sync_response',
          state: {
            products: message.state.products,
            lastSyncTimestamp: Date.now(),
          },
        });
      } else if (message.type === 'health_check') {
        workerInfo.isHealthy = true;
      }
    });
  });

  // Periodic health checks
  setInterval(() => {
    workers.forEach((workerInfo) => {
      if (workerInfo.worker.isConnected()) {
        workerInfo.worker.send({ type: 'health_check' });
      }
    });
  }, 5000);

  // Create load balancer server
  const loadBalancer = http.createServer((req, res) => {
    // Find healthy workers
    const healthyWorkers = workers.filter((w) => w.isHealthy);
    if (healthyWorkers.length === 0) {
      res.writeHead(503);
      res.end('No healthy workers available');
      return;
    }

    // Round-robin algorithm
    const worker = healthyWorkers[currentWorkerIndex % healthyWorkers.length];
    currentWorkerIndex = (currentWorkerIndex + 1) % healthyWorkers.length;

    // Forward request to worker
    const options = {
      hostname: 'localhost',
      port: worker.port,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error(`Error forwarding to worker ${worker.id}:`, err);
      worker.isHealthy = false;
      res.writeHead(502);
      res.end('Bad Gateway');
    });

    req.pipe(proxyReq);

    console.log(
      `Request forwarded to worker ${worker.id} on port ${worker.port}`
    );
  });

  // Start load balancer
  loadBalancer.listen(basePort, () => {
    console.log(`Load balancer listening on http://localhost:${basePort}`);
    console.log(`Available endpoints:`);
    console.log(`- http://localhost:${basePort}/api/products`);
    console.log(`- http://localhost:${basePort}/health`);
    console.log(`- http://localhost:${basePort}/sync-status`);
    console.log(`\nWorkers:`);
    workers.forEach((w) => {
      console.log(`- Worker ${w.id}: http://localhost:${w.port}`);
    });
  });

  // Handle worker exit
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    const workerInfo = workers.find((w) => w.worker.id === worker.id);
    if (workerInfo) {
      const newWorker = cluster.fork({
        WORKER_ID: workerInfo.id,
        WORKER_PORT: workerInfo.port,
        IS_WORKER: 'true',
      });
      workerInfo.worker = newWorker;
      workerInfo.isHealthy = true;
      workerInfo.lastSyncTimestamp = 0;

      // Reattach message handler
      newWorker.on('message', (message) => {
        if (message.type === 'operation') {
          broadcastOperation(message.operation);
        } else if (message.type === 'sync_request') {
          const missingOps = globalOperationLog.filter(
            (op) => op.timestamp > workerInfo.lastSyncTimestamp
          );
          if (missingOps.length > 0) {
            newWorker.send({
              type: 'sync_response',
              operations: missingOps,
            });
            workerInfo.lastSyncTimestamp = Math.max(
              workerInfo.lastSyncTimestamp,
              ...missingOps.map((op) => op.timestamp)
            );
          }
        }
      });
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Shutting down load balancer...');
    loadBalancer.close(() => {
      console.log('Load balancer closed');
      process.exit(0);
    });
  });
} else {
  // Worker process
  const workerId = process.env.WORKER_ID;
  const workerPort = parseInt(
    process.env.WORKER_PORT || (basePort + 1).toString()
  );

  console.log(
    `Worker ${workerId} starting on port ${workerPort} (PID: ${process.pid})`
  );

  // Setup sync with primary process
  let syncInterval: NodeJS.Timeout;

  // Listen for sync messages from primary
  process.on('message', (message: any) => {
    if (message.type === 'sync_operation') {
      // Apply synced operation
      productStore.syncOperations([message.operation]);
    } else if (message.type === 'sync_response') {
      // Apply received operations
      productStore.syncOperations(message.operations);
      console.log(
        `Worker ${workerId}: Synced ${message.operations.length} operations`
      );
    } else if (message.type === 'full_sync_response') {
      // Full sync
      productStore.fullSync(message.state.products);
      console.log(`Worker ${workerId}: Full sync completed`);
    } else if (message.type === 'health_check') {
      // Respond to health check
      if (process.send) {
        process.send({ type: 'health_check_response', workerId });
      }
    }
  });

  // Broadcast operations to primary
  const originalCreate = productStore.create.bind(productStore);
  const originalUpdate = productStore.update.bind(productStore);
  const originalDelete = productStore.delete.bind(productStore);

  productStore.create = (data: any) => {
    const result = originalCreate(data);
    if (process.send) {
      process.send({
        type: 'operation',
        operation: {
          id: result.id,
          type: 'create',
          timestamp: Date.now(),
          data: result,
          productId: result.id,
        },
      });
    }
    return result;
  };

  productStore.update = (id: string, data: any) => {
    const result = originalUpdate(id, data);
    if (result && process.send) {
      process.send({
        type: 'operation',
        operation: {
          id,
          type: 'update',
          timestamp: Date.now(),
          data: { id, updates: data, result },
          productId: id,
        },
      });
    }
    return result;
  };

  productStore.delete = (id: string) => {
    const result = originalDelete(id);
    if (result && process.send) {
      process.send({
        type: 'operation',
        operation: {
          id,
          type: 'delete',
          timestamp: Date.now(),
          data: { id },
          productId: id,
        },
      });
    }
    return result;
  };

  // Periodic sync request
  syncInterval = setInterval(() => {
    if (process.send) {
      process.send({ type: 'sync_request' });
    }
  }, 1000);

  // Start the Fastify server
  const app = buildApp();

  // Add sync status endpoint
  app.get('/sync-status', async () => {
    return productStore.getSyncStatus();
  });

  try {
    await app.listen({ port: workerPort, host: '0.0.0.0' });
    console.log(`Worker ${workerId} listening on port ${workerPort}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Cleanup on exit
  process.on('SIGTERM', () => {
    clearInterval(syncInterval);
  });
}
