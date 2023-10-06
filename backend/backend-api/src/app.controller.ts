import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
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
    );
  }
}
