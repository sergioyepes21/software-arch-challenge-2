import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataAccess } from 'src/data-access/data-access.interface';
import { TaskCommonService } from './task-common.service';
import { v4 as uuidv4} from 'uuid';

@Injectable()
export class RecordSigningTaskService {
  private TABLE_CLOSURE = process.env.TABLE_CLOSURE;

  private readonly RECORD_SIGNING_TEST_CASE_ENABLED: boolean =
    process.env.RECORD_SIGNING_TEST_CASE_ENABLED === 'true';

  private readonly MAX_NUMBER_OF_RECORDS_TO_UNSIGN: number =
    +process.env.MAX_NUMBER_OF_RECORDS_TO_UNSIGN;

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
    await this.dataAccess.persistDayClosure(
      uuidv4(),
      transactions,
      dayClosure,
      this.TABLE_CLOSURE,
      false,
    );
  }
}
