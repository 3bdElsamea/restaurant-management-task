import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Customer } from './customer.schema';

@Schema()
export class Order extends Document {
  @Prop({ required: true })
  customer: Customer;

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  // Reference to order items (one-to-many relationship)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'OrderItem' }] })
  items: Types.Array<Types.ObjectId>;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Middleware to automatically populate 'items' field
OrderSchema.pre('find', function () {
  this.populate({
    path: 'items',
    model: 'OrderItem',
    select: 'name quantity price',
  });
});

OrderSchema.pre('findOne', function () {
  this.populate({
    path: 'items',
    model: 'OrderItem',
    select: 'name quantity price',
  });
});

OrderSchema.pre('save', async function (next) {
  await this.populate({
    path: 'items',
    model: 'OrderItem',
    select: 'name quantity price',
  });
  next();
});
