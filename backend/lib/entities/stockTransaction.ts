import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product";
import { User } from "./user";


@Entity("stock_transactions")
export class StockTransaction {
    @PrimaryGeneratedColumn({ type: "int" })
    id!: number;

    @ManyToOne(() => Product, { eager: true })
    @JoinColumn({ name: "product_id" })
    product!: Product;

    @Column({ type: "int", name: "product_id" })
    productId!: number;

    @Column({ type: "enum", enum: ["in", "out"], name: "action_type" })
    actionType!: "in" | "out";

    @Column({ type: "int", name: "amout" })
    amount!: number;

    @Column({ type: "date", name: "action_date" })
    actionDate!: Date;

    @Column({ type: "text", nullable: true })
    note?: string;

    @ManyToOne(() => User, { eager: true })
    @Column({ name: "action_by" })
    actionBy!: number

}