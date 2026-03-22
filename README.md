# Product Catalog CRUD API

A simple, fast, and lightweight RESTful CRUD API for managing a product catalog, built with Node.js, Fastify, and TypeScript.

## Features

- **CRUD Operations**: Full Create, Read, Update, and Delete functionality for products.
- **RESTful API**: Follows standard REST conventions.
- **TypeScript**: Fully typed codebase for better maintainability and developer experience.
- **Fastify**: High-performance web framework with low overhead.
- **Development Hot-Reload**: Uses `tsx watch` for instant feedback during development.
- **Optimized Build**: Bundled with `tsup` for efficient production deployment.
- **Testing**: Integrated with Vitest for unit and integration tests.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 24.10.0 or higher
- **npm**: Version 10.9.2 or higher

## Installation

```
npm install
```

## Running the Application

The application can be run in three modes: development, production and multiple instances.

## Development Mode

In development mode, the server runs with hot-reload. Any changes you make to the source code will automatically restart the server.

```
npm run start:dev
```

By default, the server will start on `http://localhost:3000/api`.
You should see a message like: `Server listening on http://localhost:3000/api`

## Production Mode

For production, the application is built into a single, optimized bundle before starting.

1. Build and Start (one command):

   ```
   npm run start:prod
   ```

   This command runs two scripts sequentially:
   - build: Bundles the TypeScript code into dist/index.js.
   - start: Runs the bundled code with Node.js.

2. Build Only (if you want to build separately):

   ```
   npm run build
   ```

3. Start Only (after building):
   ```
   npm run start
   ```

The server will then run on `http://localhost:3000/api`

## Multiple instances Mode

Script that starts multiple instances:

```
npm run start:multi
```

By default, the server will start on `http://localhost:3000/api` with a load balancer that distributes requests across
instances equal to the number of available parallelism - 1 on the host machine, each listening on port PORT + n.

## Product Schema

All products in the catalog follow this schema:

| Field         | Type          | Required             | Description                       | Validation             |
| ------------- | ------------- | -------------------- | --------------------------------- | ---------------------- |
| `id`          | string (UUID) | Yes (auto-generated) | Unique identifier for the product | UUID v4 format         |
| `name`        | string        | Yes                  | Product name                      | String value           |
| `description` | string        | Yes                  | Detailed product description      | String value           |
| `price`       | number        | Yes                  | Product price                     | Must be greater than 0 |
| `category`    | string        | Yes                  | Product category                  | String value           |
| `inStock`     | boolean       | Yes                  | Product availability status       | Boolean value          |

### Example Product Object

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Wireless Headphones",
  "description": "Noise-cancelling Bluetooth headphones with 30-hour battery life",
  "price": 89.99,
  "category": "Electronics",
  "inStock": true
}
```

## API Endpoints

1. Get All Products
   Endpoint: `GET /api/products`

   Example cURL:

   ```bash
   curl -X GET http://localhost:3000/api/products
   ```

2. Get Product by ID
   Endpoint: `GET /api/products/:id`

   Example cURL:

   ```bash
   curl -X GET http://localhost:3000/api/products/550e8400-e29b-41d4-a716-446655440000
   ```

3. Create Product
   Endpoint: `POST /api/products`

   Example cURL:

   ```bash
   curl -X POST http://localhost:3000/api/products \
   -H "Content-Type: application/json" \
   -d '{
       "name": "Wireless Headphones",
       "description": "Noise-cancelling Bluetooth headphones with 30-hour battery life",
       "price": 89.99,
       "category": "Electronics",
       "inStock": true
   }'
   ```

4. Update Product (Full Update)
   Endpoint: `PUT /api/products/:id`

   Example cURL:

   ```bash
   curl -X PUT http://localhost:3000/api/products/550e8400-e29b-41d4-a716-446655440000 \
   -H "Content-Type: application/json" \
   -d '{
       "name": "Premium Wireless Headphones",
       "description": "Updated: Premium noise-cancelling headphones with 40-hour battery life",
       "price": 129.99,
       "category": "Electronics",
       "inStock": true
   }'
   ```

5. Delete Product
   Endpoint: `DELETE /api/products/:id`

   Example cURL:

   ```bash
   curl -X DELETE http://localhost:3000/api/products/550e8400-e29b-41d4-a716-446655440000
   ```

## Test Command

To run all tests once with verbose output:

```
npm test
```

What happens:

- Vitest discovers all test files (typically _.test.ts or _.spec.ts)

- Executes all test suites

- Displays detailed results using the verbose reporter

- Shows each test case name, status, and execution time
