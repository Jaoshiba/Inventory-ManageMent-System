import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { Category } from "./categories";


@Entity("products")
export class Product {
    @PrimaryGeneratedColumn({ type: "int" })
    id!: number

    @Column({ type: "int", unique: true})
    sku!: number

    @Column({ type: "varchar", length: 100 })
    name!: string

    @Column({ type: "double precision"})
    cost!: number

    @Column({ type: "double precision"})
    price!: number

    @Column({ type: "int", name: "stock_remain" })
    stockRemain!: number

    @ManyToOne(() => Category, (category) => category.products,{ eager: true})
    category!: Category
    @JoinColumn({ name: "categories"})
    category_id!: number

}