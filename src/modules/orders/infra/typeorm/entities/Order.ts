import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import Customer from '@modules/customers/infra/typeorm/entities/Customer';
import OrdersProducts from '@modules/orders/infra/typeorm/entities/OrdersProducts';

@Entity('orders')
class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToMany(() => OrdersProducts, ordersProducts => ordersProducts.order, {
    eager: true,
    cascade: true,
  })
  order_products: OrdersProducts[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default Order;
