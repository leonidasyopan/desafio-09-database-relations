import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Order from '@modules/orders/infra/typeorm/entities/Order';
import IOrdersRepository from '@modules/orders/repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateProductService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customerExists = await this.customersRepository.findById(customer_id);

    if (!customerExists) {
      throw new AppError(`There is no such customer. Please check it out!`);
    }

    const productsId = products.map(product => ({ id: product.id }));

    const findProducts = await this.productsRepository.findAllById(productsId);

    if (findProducts.length !== products.length) {
      throw new AppError(`Some products couldn't be found`);
    }

    const updatedProductsQuantity: IUpdateProductsQuantityDTO[] = [];

    const updatedProducts = findProducts.map(findProduct => {
      const productOrdered = products.find(
        product => product.id === findProduct.id,
      );

      if (productOrdered) {
        if (findProduct.quantity < productOrdered.quantity) {
          throw new AppError(
            `We have ${findProduct.quantity} ${findProduct.name}(s) in stock. Unfortunately, You have ordered ${productOrdered.quantity}.`,
          );
        }

        updatedProductsQuantity.push({
          id: productOrdered.id,
          quantity: findProduct.quantity - productOrdered.quantity,
        });

        return {
          ...findProduct,
          quantity: productOrdered.quantity,
        };
      }

      return findProduct;
    });

    await this.productsRepository.updateQuantity(updatedProductsQuantity);

    const order = await this.ordersRepository.create({
      customer: customerExists,
      products: updatedProducts.map(product => ({
        product_id: product.id,
        price: product.price,
        quantity: product.quantity,
      })),
    });

    return order;
  }
}

export default CreateProductService;
