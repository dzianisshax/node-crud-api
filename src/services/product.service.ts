import { productStore } from '../store/product.store.js';
import { ProductDTO } from '../types/product.js';

export class ProductService {
  getAllProducts() {
    return productStore.findAll();
  }

  getProductById(id: string) {
    return productStore.findById(id);
  }

  createProduct(data: ProductDTO) {
    return productStore.create(data);
  }

  updateProduct(id: string, data: ProductDTO) {
    return productStore.update(id, data);
  }

  deleteProduct(id: string) {
    return productStore.delete(id);
  }
}

export const productService = new ProductService();
