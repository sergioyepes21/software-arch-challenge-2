import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { TaskCommonService } from './task-common.service';
type TransactionBody = {
  transactions: number[];
  userID: string;
  tableName: string;
};

@Injectable()
export class DayClosureTestCaseTaskService {
  private TABLE_CLOSURE = process.env.TABLE_CLOSURE;

  private MAX_OF_DATABASE_TESTS: number = +process.env.MAX_OF_DATABASE_TESTS;

  private PROBABILITY_OF_WRONG_TABLE_NAME: number = +process.env.PROBABILITY_OF_WRONG_TABLE_NAME;

  private totalOfTests: number = 0;

  private readonly DAY_CLOSURE_TEST_CASE_ENABLED: boolean =
    process.env.DAY_CLOSURE_TEST_CASE_ENABLED === 'true';

  constructor(
    private readonly httpService: HttpService,
    private taskCommonService: TaskCommonService,
  ) {}

  @Cron(CronExpression.EVERY_SECOND, {
    name: DayClosureTestCaseTaskService.name,
  })
  async handleCron(): Promise<void> {
    const shouldRun = this.taskCommonService.checkCronJobLimit(
      DayClosureTestCaseTaskService.name,
      this.totalOfTests,
      this.MAX_OF_DATABASE_TESTS,
      this.DAY_CLOSURE_TEST_CASE_ENABLED,
    );
    if (!shouldRun) return;

    this.totalOfTests += 1;
    await this.sendRequest();
  }

  private async sendRequest(): Promise<void> {
    const body = this.buildRandomTransactionsBody();
    const { data: response } = await firstValueFrom(
      this.httpService.post('/calculate-day-closure', body, {
        headers: {
          'X-UserID': body.userID,
        },
      }),
    );
    const regMatchCorrectResponse = /The closure of the day is: [0-9]+/;
    if(!regMatchCorrectResponse.test(response)) 
      console.log(`Test #${this.totalOfTests} does not have the correct answer: ${response}`);
  }

  private buildRandomTransactionsBody(): TransactionBody {
    const transactions: number[] = [];
    const userID = uuid();
    const tableName = this.tableName();

    for (let i = 0; i < 5; i++) {
      const randomInteger = Math.floor(Math.random() * 101);
      transactions.push(randomInteger);
    }
    return {
      transactions,
      userID,
      tableName,
    };
  }

  private tableName(): string {
    const p = Math.random();
    if (p < this.PROBABILITY_OF_WRONG_TABLE_NAME) {
      return this.TABLE_CLOSURE;
    }
    return 'wrong-table-name';
  }
}
