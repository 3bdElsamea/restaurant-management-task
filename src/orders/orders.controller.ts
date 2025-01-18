import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UsePipes,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Serialize } from '../Interceptors/serialize.interceptor';
import { OrderDto } from './dtos/order/order.dto';
import { ObjectIdValidationPipe } from '../pipes/object-id.validation.pipe';
import { CreateOrderDto } from './dtos/order/create-order.dto';
import { UpdateOrderDto } from './dtos/order/update-order.dto';

@Controller('orders')
@Serialize(OrderDto)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @UsePipes(ObjectIdValidationPipe)
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    return await this.ordersService.create(createOrderDto);
  }

  @Put(':id')
  async update(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return await this.ordersService.update(id, updateOrderDto);
  }
}
