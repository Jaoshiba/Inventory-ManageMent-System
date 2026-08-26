import { getDataSource } from "@/lib/datasource";
import { Product } from "@/lib/entities/product";
import { LessThan } from "typeorm";



export class ProductRepository {
  private async repo() {
    const ds = await getDataSource();
    return ds.getRepository(Product);
  }

  async getProductById(id: number) {
    const repo = await this.repo();
    return repo.findOne({ where: { id } });
  }

  async getProductBySku(sku: number) {
    const repo = await this.repo();
    return repo.findOne({ where: { sku } });
  }

  async createProduct(product: Product) {
    const repo = await this.repo();
    return repo.save(product);
  }

  async updateProduct(product: Product) {
    const repo = await this.repo();
    return repo.save(product);
  } 

  async getLowAmountProduct(amount: number | 5) {
    const repo = await this.repo();
    return repo.find({
      where: { stockRemain: LessThan(amount) },
      order: { stockRemain: "ASC" },
    });
  }

  async getProductsByCategoryId(category: string){
    const repo = await this.repo();
    return repo.find({
        where: {name: category}
    });
  }
}
  