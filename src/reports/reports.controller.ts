import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily-sales')
  async getDailySalesReport(@Query('date') date?: string) {
    return this.reportsService.generateDailySalesReport(date);
  }
}
