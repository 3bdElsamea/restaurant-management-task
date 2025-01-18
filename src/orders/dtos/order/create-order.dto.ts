import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { CreateCustomerDto } from '../customer/create-customer.dto';
import { CreateOrderItemDto } from '../order-item/create-order-item.dto';

export class CreateOrderDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateCustomerDto)
  customer: CreateCustomerDto;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
