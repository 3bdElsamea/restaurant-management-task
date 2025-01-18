import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class OrderItem extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  price: number;

  // Reference to the order this item belongs to
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order: Types.ObjectId;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
