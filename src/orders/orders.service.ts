import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Order } from './schemas/order.schema';
import { Connection, Model, Types } from 'mongoose';
import { OrderItem } from './schemas/order-item.schema';
import { CreateOrderDto } from './dtos/order/create-order.dto';
import { CreateOrderItemDto } from './dtos/order-item/create-order-item.dto';
import { UpdateOrderDto } from './dtos/order/update-order.dto';
import { UpdateOrderItemDto } from './dtos/order-item/update-order-item.dto';

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
        throw new BadRequestException(
          `Failed to create order items: ${error.message}. Order creation rolled back.`,
        );
      }
    } catch (error) {
      throw new BadRequestException(`Failed to create order: ${error.message}`);
    }
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    try {
      const order = await this.findOne(id);

      const existingItems = await this.orderItemModel
        .find({ order: order._id })
        .select('_id')
        .lean();

      const { itemsToUpdate, itemsToCreate } = this.segregateItems(
        updateOrderDto.items,
      );

      const itemsToDelete = this.getItemsToDelete(existingItems, itemsToUpdate);
      const handledItems = await Promise.all([
        this.bulkUpdateItems(itemsToUpdate),

        this.orderItemModel.insertMany(
          itemsToCreate.map((item) => ({
            ...item,
            order: order._id,
          })),
        ),

        itemsToDelete.length > 0
          ? this.orderItemModel.deleteMany({ _id: { $in: itemsToDelete } })
          : Promise.resolve(),
      ]);

      return this.updateOrderDetails(order, updateOrderDto, handledItems);
    } catch (error) {
      throw new BadRequestException(`Failed to update order: ${error.message}`);
    }
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

  private segregateItems(items: UpdateOrderItemDto[]) {
    return items.reduce(
      (acc, item) => {
        if (item.id) {
          acc.itemsToUpdate.push(item);
        } else {
          acc.itemsToCreate.push(item);
        }
        return acc;
      },
      {
        itemsToUpdate: [] as UpdateOrderItemDto[],
        itemsToCreate: [] as UpdateOrderItemDto[],
      },
    );
  }

  private async bulkUpdateItems(
    items: UpdateOrderItemDto[],
  ): Promise<Types.ObjectId[]> {
    if (!items.length) return [];

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: this.prepareItemData(item) },
      },
    }));

    await this.orderItemModel.bulkWrite(bulkOps);
    return items.map((item) => new Types.ObjectId(item.id));
  }

  private getItemsToDelete(
    existingItems: any[],
    itemsToUpdate: UpdateOrderItemDto[],
  ): string[] {
    const updateIds = itemsToUpdate.map((item) => item.id);
    return existingItems
      .map((item) => item._id.toString())
      .filter((id) => !updateIds.includes(id));
  }

  private prepareItemData(item: UpdateOrderItemDto) {
    const itemData = { ...item };
    delete itemData.id;
    return itemData;
  }

  private updateOrderDetails(
    order: Order,
    updateOrderDto: UpdateOrderDto,
    items: any[],
  ) {
    order.customer = updateOrderDto.customer;
    order.totalPrice = this.calculateTotalPrice(updateOrderDto.items);
    const [updatedItemIds, newItems] = items;
    order.items = [
      ...updatedItemIds,
      ...newItems.map((item: { _id: any }) => item._id),
    ] as Types.Array<Types.ObjectId>;

    return order.save();
  }
}
