import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "armersohn_orders" })
export class Order {
    @PrimaryGeneratedColumn()
    id!: number;


    @Column({ type: "varchar", length: 60 }) 
    identifier!: string;


    @Column({ type: "varchar", length: 50 }) 
    item!: string;


    @Column({ type: "varchar", length: 100 }) 
    label!: string;


    @Column({ type: "int" }) 
    qty!: number;


    @Column({ type: "varchar", length: 50, nullable: true }) 
    category!: string;

    @Column({ type: "varchar", length: 20, nullable: true })
    plate!: string | null;

    @Column({ type: "text", nullable: true })
    color!: string | null; 
}