import { Injectable } from '@nestjs/common';
import { DataAccess } from './data-access/data-access.interface';
import { CalculationIntegration } from './calculation-integration/calculation-integration.interface';

@Injectable()
export class AppService {

  constructor(
    private readonly calculationIntegration: CalculationIntegration,
    private readonly dataAccess: DataAccess,
  ) { }

  async calculateDayClosure(
    userID: string,
    transactions: number[],
    tableName: string,
  ): Promise<string> {
    const closure = await this.calculationIntegration.calculateDayClosure(transactions);
    await this.dataAccess.persistDayClosure(userID, transactions, closure, tableName);
    return 'The closure of the day is: ' + closure;
  }

  async enableAllCompute(

  ): Promise<void> {
    await this.calculationIntegration.enableAllCompute();
  }

  async validateClosure(
    userID: string,
    date: string
  ): Promise<string> {
    return await this.dataAccess.validateClosure(userID, date);
  }
}
