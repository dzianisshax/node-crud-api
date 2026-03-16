import { productStore } from '../store/product.store.js';
import { CreateProductDTO, UpdateProductDTO } from '../types/product.js';

export class ProductService {
  getAllProducts() {
    return productStore.findAll();
  }

  getProductById(id: string) {
    return productStore.findById(id);
  }

  createProduct(data: CreateProductDTO) {
    return productStore.create(data);
  }

  updateProduct(id: string, data: UpdateProductDTO) {
    return productStore.update(id, data);
  }

  deleteProduct(id: string) {
    return productStore.delete(id);
  }
}

export const productService = new ProductService();
