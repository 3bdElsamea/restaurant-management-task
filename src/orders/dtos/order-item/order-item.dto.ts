import { Expose } from 'class-transformer';

export class OrderItemDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  quantity: number;

  @Expose()
  price: number;
}
