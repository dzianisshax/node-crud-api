export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
}

export type CreateProductDTO = Omit<Product, 'id'>;
export type UpdateProductDTO = Partial<CreateProductDTO>;
