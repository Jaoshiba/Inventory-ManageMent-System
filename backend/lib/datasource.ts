import { DataSource } from "typeorm";
import { Category } from "./entities/categories";
import { Product } from "./entities/product";
import { User } from "./entities/user";
import { StockTransaction } from "./entities/stockTransaction";


console.log(process.env.DB_HOST, process.env.DB_PORT, process.env.DB_USERNAME, process.env.DB_PASSWORD, process.env.DB_NAME);
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: true,
  entities: [Product, Category, User, StockTransaction],
});


declare global {
  var __appDataSource: DataSource | undefined;
}


export async function getDataSource(): Promise<DataSource> {
  if (global.__appDataSource) {
    if (!global.__appDataSource.isInitialized) {
      await global.__appDataSource.initialize();
    }
    return global.__appDataSource;
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  global.__appDataSource = AppDataSource;
  return AppDataSource;
}