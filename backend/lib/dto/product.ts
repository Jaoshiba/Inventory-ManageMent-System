export interface CreateProductRequest{
    name: string,
    sku: number
    cost: number,
    price: number,
    stockRemain?: number
    categoryId: number,
}
export interface UpdateStockRequest {
  sku: number;
  amount: number;
  note?: string;
}