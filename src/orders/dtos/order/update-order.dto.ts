import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { UpdateCustomerDto } from '../customer/update-customer.dto';
import { UpdateOrderItemDto } from '../order-item/update-order-item.dto';

export class UpdateOrderDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UpdateCustomerDto)
  customer: UpdateCustomerDto;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemDto)
  items: UpdateOrderItemDto[];
}
