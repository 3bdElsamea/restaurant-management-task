import { Expose, Transform, Type } from 'class-transformer';
import { OrderItemDto } from '../order-item/order-item.dto';
import { CustomerDto } from '../customer/customer.dto';

export class OrderDto {
  @Expose()
  id: string;

  @Expose()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @Expose()
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @Expose()
  totalPrice: number;

  @Expose()
  @Transform(({ value }) => value.toISOString())
  timestamp: string;
}
