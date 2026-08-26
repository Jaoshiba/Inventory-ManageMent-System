import { getDataSource } from "@/lib/datasource";
import { StockTransaction } from "@/lib/entities/stockTransaction";



export class StockTransactionRepository {

    private async repo() {
        const ds = await getDataSource();
        return ds.getRepository(StockTransaction);
    }

    async createStockTransaction(stockTransaction: StockTransaction) {
        const repo = await this.repo();
        return repo.save(stockTransaction);
    }

}