import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product";

@Entity("categories")
export class Category {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: "varchar", length: 100 })
    name!: string

    @OneToMany(() => Product, (product) => product.category )
    products!: Product[]
}