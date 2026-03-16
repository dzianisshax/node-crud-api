import { FastifyRequest, FastifyReply } from 'fastify';
import { productService } from '../services/product.service.js';
import { CreateProductDTO, UpdateProductDTO } from '../types/product.js';

export const getAllProducts = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const products = productService.getAllProducts();
  return reply.send(products);
};

export const getProductById = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const product = productService.getProductById(req.params.id);
  if (!product) {
    return reply.code(404).send({
      statusCode: 404,
      message: `Record with id ${req.params.id} doesn't exist`,
    });
  }
  return reply.send(product);
};

export const createProduct = async (
  req: FastifyRequest<{ Body: CreateProductDTO }>,
  reply: FastifyReply,
) => {
  const newProduct = productService.createProduct(req.body);
  return reply.code(201).send(newProduct);
};

export const updateProduct = async (
  req: FastifyRequest<{ Params: { id: string }; Body: UpdateProductDTO }>,
  reply: FastifyReply,
) => {
  const updatedProduct = productService.updateProduct(req.params.id, req.body);
  if (!updatedProduct) {
    return reply.code(404).send({
      statusCode: 404,
      message: `Record with id ${req.params.id} doesn't exist`,
    });
  }
  return reply.send(updatedProduct);
};

export const deleteProduct = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const isDeleted = productService.deleteProduct(req.params.id);
  if (!isDeleted) {
    return reply.code(404).send({
      statusCode: 404,
      message: `Record with id ${req.params.id} doesn't exist`,
    });
  }
  return reply.code(204).send();
};
