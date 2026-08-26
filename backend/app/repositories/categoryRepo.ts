import { getDataSource } from "@/lib/datasource";
import { Category } from "@/lib/entities/categories";



export class CategoryRepository {

    private async repo() {
    const ds = await getDataSource();
    return ds.getRepository(Category);
  }

  async createCategory(category: Category) {
    const repo = await this.repo();
    return repo.save(category);
  }

  async getCategoryById(id: number) {
    const repo = await this.repo();
    return repo.findOne({ where: { id } });
  }
}