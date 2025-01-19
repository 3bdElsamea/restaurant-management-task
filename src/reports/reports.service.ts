import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../orders/schemas/order.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
  ) {}

  async generateDailySalesReport(date?: string) {
    try {
      const { startOfDay, endOfDay } = this.getDateRange(date);
      console.log(startOfDay, endOfDay);

      const report = await this.orderModel.aggregate([
        {
          $match: {
            timestamp: { $gte: startOfDay, $lte: endOfDay },
          },
        },
        {
          $lookup: {
            from: 'orderitems',
            localField: 'items',
            foreignField: '_id',
            as: 'itemsDetails',
          },
        },
        {
          $facet: {
            itemsSummary: [
              { $unwind: '$itemsDetails' },
              {
                $group: {
                  _id: '$itemsDetails.name',
                  totalQuantity: { $sum: '$itemsDetails.quantity' },
                  totalRevenue: {
                    $sum: {
                      $multiply: [
                        '$itemsDetails.quantity',
                        '$itemsDetails.price',
                      ],
                    },
                  },
                },
              },
              { $sort: { totalQuantity: -1 } },
              { $limit: 10 }, // Limit to top 10 items
            ],
            overallSummary: [
              {
                $group: {
                  _id: null,
                  totalOrders: { $sum: 1 },
                  totalRevenue: {
                    $sum: {
                      $sum: {
                        $map: {
                          input: '$itemsDetails',
                          as: 'item',
                          in: {
                            $multiply: ['$$item.quantity', '$$item.price'],
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
        {
          $project: {
            date: { $dateToString: { format: '%Y-%m-%d', date: startOfDay } },
            totalOrders: {
              $ifNull: [
                { $arrayElemAt: ['$overallSummary.totalOrders', 0] },
                0,
              ],
            },
            totalRevenue: {
              $ifNull: [
                { $arrayElemAt: ['$overallSummary.totalRevenue', 0] },
                0,
              ],
            },
            topItems: '$itemsSummary',
          },
        },
      ]);

      return report.length
        ? report[0]
        : { message: 'No data for the selected day.' };
    } catch (error) {
      throw new BadRequestException(
        'Failed to generate report: ' + error.message,
      );
    }
  }

  private getDateRange(date: string) {
    const targetDate = date ? new Date(date) : new Date();

    const timezoneOffset = targetDate.getTimezoneOffset() * 60 * 1000;

    const startOfDay = new Date(
      targetDate.setHours(0, 0, 0, 0) - timezoneOffset,
    );
    const endOfDay = new Date(
      targetDate.setHours(23, 59, 59, 999) - timezoneOffset,
    );

    return { startOfDay, endOfDay };
  }
}
