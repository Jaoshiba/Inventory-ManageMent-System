import { Product } from "@/lib/entities/product";
import { ProductRepository } from "../repositories/productRepo";
import { CategoryRepository } from "../repositories/categoryRepo";
import { StockTransactionRepository } from "../repositories/stockTransactionRepo";
import { StockTransaction } from "@/lib/entities/stockTransaction";
import { CreateProductRequest, UpdateStockRequest } from "@/lib/dto/product";



export class AppError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
  }
}


export class ProductService {
  private productRepo = new ProductRepository();
  private categoryRepo = new CategoryRepository();
  private stockTransactionRepo = new StockTransactionRepository();


  async createProduct(productRequest: CreateProductRequest) {
    const requestVar = ["name", "cost", "price", "categoryId"];

  for (let i=0; i < requestVar.length; i++) {
    const varname = requestVar[i];
    if (!productRequest.hasOwnProperty(varname)) {
      throw new AppError("Missing " + varname, 400);
    }
  }

  const productData = await this.productRepo.getProductBySku(productRequest.sku)
  if (productData) {
    throw new AppError("Product with sku " + productRequest.sku + " already exists", 400);
  }

  const categoryData = await this.categoryRepo.getCategoryById(productRequest.categoryId)
  if (!categoryData) {
    throw new AppError("Category with id " + productRequest.categoryId + " does not exist", 400);
  }

  const newProduct = new Product();
  try{
    
    newProduct.name = productRequest.name;
    newProduct.sku = productRequest.sku;
    newProduct.cost = productRequest.cost;
    newProduct.price = productRequest.price;
    newProduct.stockRemain = productRequest.stockRemain ?? 0;
    newProduct.category = categoryData;
    newProduct.category_id = categoryData.id;   

  }catch (error) {
      console.error(error);
      throw new AppError("Invalid product data", 400);
  }
  

  return this.productRepo.createProduct(newProduct);

  }

  async updateProductRemain(request: UpdateStockRequest): Promise<Product> {
    if (typeof request.sku !== "number" || typeof request.amount !== "number") {
      throw new AppError("Invalid product data", 400);
    }

    if (request.amount === 0) {
      throw new AppError("amount must not be 0", 400);
    }

    const productData = await this.productRepo.getProductBySku(request.sku);
    if (!productData) {
      throw new AppError("Product not found", 404);
    }

    const newStock = productData.stockRemain + request.amount;
    if (newStock < 0) {
      throw new AppError(
        `Insufficient stock (current: ${productData.stockRemain}, requested: ${request.amount})`,
        400
      );
    }
    productData.stockRemain = newStock;

    const newStockTransaction = new StockTransaction();
    newStockTransaction.product = productData;
    newStockTransaction.productId = productData.id;
    newStockTransaction.actionType = request.amount >= 0 ? "in" : "out";
    newStockTransaction.amount = Math.abs(request.amount);
    newStockTransaction.actionDate = new Date();
    newStockTransaction.actionBy = 1; // TODO: แทนที่ด้วย user id จาก auth เมื่อทำ JWT เสร็จ
    newStockTransaction.note = request.note ?? "";

    const productTransaction = await this.stockTransactionRepo.createStockTransaction(
      newStockTransaction
    );
    if (!productTransaction) {
      throw new AppError("Failed to create stock transaction", 500);
    }

    return this.productRepo.updateProduct(productData);
  }

  async getLowStockProducts(amount: number = 5): Promise<{ count: number; products: Product[] }> {
    if (amount < 0) {
      throw new AppError("amount must not be negative", 400);
    }

    const products = await this.productRepo.getLowAmountProduct(amount);
    return {
      count: products.length,
      products,
    };
  }
}