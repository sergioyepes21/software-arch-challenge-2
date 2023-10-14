import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class TaskCommonService {
  constructor(private schedulerRegistry: SchedulerRegistry) {}

  disableCronJob(cronJobName: string): void {
    const job = this.schedulerRegistry.getCronJob(cronJobName);
    job.stop();
  }

  checkCronJobLimit(
    cronJobName: string,
    totalOfTests: number,
    maxOfTests: number,
    shouldCronRun: boolean,
  ): boolean {
    if (totalOfTests >= maxOfTests || !shouldCronRun) {
      console.log(`${cronJobName}: All tests done`);
      this.disableCronJob(cronJobName);
      return false;
    }
    return true;
  }

  randomTransactions(): number[] {
    const transactions: number[] = [];
    for (let i = 0; i < 5; i++) {
      const randomInteger = Math.floor(Math.random() * 101);
      transactions.push(randomInteger);
    }
    return transactions;
  }
}
