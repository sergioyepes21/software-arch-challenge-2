import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataAccess } from 'src/data-access/data-access.interface';
import { TaskCommonService } from './task-common.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RecordSigningTaskService {
  private TABLE_CLOSURE = process.env.TABLE_CLOSURE;

  private readonly RECORD_SIGNING_TEST_CASE_ENABLED: boolean =
    process.env.RECORD_SIGNING_TEST_CASE_ENABLED === 'true';

  private readonly MAX_NUMBER_OF_RECORDS_TO_UNSIGN: number =
    +process.env.MAX_NUMBER_OF_RECORDS_TO_UNSIGN;

  private readonly PROBABILITY_OF_UNSIGNED_RECORDS: number =
    +process.env.PROBABILITY_OF_UNSIGNED_RECORD;

  private totalOfTests = 0;

  constructor(
    private readonly dataAccess: DataAccess,
    private taskCommonService: TaskCommonService,
  ) {}

  @Cron(CronExpression.EVERY_SECOND, {
    name: RecordSigningTaskService.name,
  })
  async handleTimeout() {
    const shouldRun = this.taskCommonService.checkCronJobLimit(
      RecordSigningTaskService.name,
      this.totalOfTests,
      this.MAX_NUMBER_OF_RECORDS_TO_UNSIGN,
      this.RECORD_SIGNING_TEST_CASE_ENABLED,
    );
    if (!shouldRun) return;

    this.totalOfTests += 1;

    const transactions = this.taskCommonService.randomTransactions();
    const dayClosure: number = transactions.reduce(
      (acc, curr) => acc + curr,
      0,
    );

    const userID = uuidv4();
    
    const p = Math.random();
    let isSigned = p > this.PROBABILITY_OF_UNSIGNED_RECORDS;

    if(!isSigned) 
      console.log(`Record USER#${userID} should be unsigned`);
    
    await this.dataAccess.persistDayClosure(
      userID,
      transactions,
      dayClosure,
      this.TABLE_CLOSURE,
      isSigned,
    );
  }
}
