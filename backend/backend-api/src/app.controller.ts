import { Body, Controller, Get, Headers, Post, Put, UnauthorizedException } from '@nestjs/common';
import { AppService } from './app.service';
import { CalculateDayClosure } from './models/calculate-day-closure.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/calculate-day-closure')
  async calculateDayClosure(
    @Body() body: CalculateDayClosure,
    @Headers('x-userid') userID: string,
  ): Promise<string> {
    if(!userID) throw new UnauthorizedException('No se ha enviado el header X-UserID');
    return this.appService.calculateDayClosure(
      userID,
      body.transactions,
      body.tableName,
    );
  }
  
  @Put('/enable-all-compute')
  async enableAllCompute(
    @Headers('x-userid') userID: string,
  ): Promise<string> {
    if(!userID) throw new UnauthorizedException('No se ha enviado el header X-UserID');
    await this.appService.enableAllCompute();
    return 'All compute enabled';
  }

  @Post('/validate-closure')
  async validateClosure(
    @Headers('x-userid') userID: string,
    @Body('date') date: string
  ): Promise<string> {
    if(!userID) throw new UnauthorizedException('No se ha enviado el header X-UserID');
    return this.appService.validateClosure(userID, date);
  }
}
