import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Order } from './schemas/order.schema';
import { Connection, Model, Types } from 'mongoose';
import { OrderItem } from './schemas/order-item.schema';
import { CreateOrderDto } from './dtos/order/create-order.dto';
import { CreateOrderItemDto } from './dtos/order-item/create-order-item.dto';
import { UpdateOrderDto } from './dtos/order/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
    @InjectModel(OrderItem.name)
    private readonly orderItemModel: Model<OrderItem>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }
    return order;
  }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      const order = await this.createInitialOrder(createOrderDto);
      try {
        const orderItems = await this.createOrderItems(
          createOrderDto.items,
          order._id as Types.ObjectId,
        );

        order.items = orderItems.map(
          (item) => item._id,
        ) as Types.Array<Types.ObjectId>;

        return order.save();
      } catch (error) {
        await this.orderModel.findByIdAndDelete(order._id);
        throw new Error(
          `Failed to create order items: ${error.message}. Order creation rolled back.`,
        );
      }
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    const { customer, items } = updateOrderDto;

    const incomingItemIds = items.map((item) => item.id).filter((id) => !!id); // Filter out null/undefined IDs

    const existingItemIds = (
      await this.orderItemModel.find({ order: order._id }).select('_id').exec()
    ).map((item) => item._id.toString());

    const itemIdsToDelete = existingItemIds.filter(
      (existingId) => !incomingItemIds.includes(existingId),
    );

    if (itemIdsToDelete.length > 0) {
      await this.orderItemModel.deleteMany({ _id: { $in: itemIdsToDelete } });
    }

    const updatedItems: Types.ObjectId[] = [];
    await Promise.all(
      items.map(async (item) => {
        const itemData = { ...item };
        delete itemData.id;

        if (item.id) {
          await this.orderItemModel.updateOne(
            { _id: item.id },
            { $set: itemData },
          );
          const foundItem = await this.orderItemModel.findById(item.id);
          updatedItems.push(foundItem._id as Types.ObjectId);
        } else {
          const newItem = new this.orderItemModel({
            ...itemData,
            order: order._id,
          });
          await newItem.save();
          updatedItems.push(newItem._id as Types.ObjectId);
        }
      }),
    );

    // Update the order
    order.customer = customer;
    order.totalPrice = this.calculateTotalPrice(items);
    order.items = updatedItems as Types.Array<Types.ObjectId>;

    return order.save();
  }

  /** Helpers **/
  private async createInitialOrder(
    createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    const { customer, items } = createOrderDto;

    const order = new this.orderModel({
      customer,
      totalPrice: this.calculateTotalPrice(items),
      items: [],
    });

    return order.save();
  }

  private async createOrderItems(
    items: CreateOrderItemDto[],
    orderId: Types.ObjectId,
  ): Promise<OrderItem[]> {
    return this.orderItemModel.insertMany(
      items.map((item) => ({
        ...item,
        order: orderId,
      })),
    );
  }

  private calculateTotalPrice(items: CreateOrderItemDto[]): number {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }
}
