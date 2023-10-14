import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataAccess } from 'src/data-access/data-access.interface';
import { TaskCommonService } from './task-common.service';

@Injectable()
export class ModifyClosureTaskService {

  private readonly MODIFY_CLOSURE_TEST_CASE_ENABLED: boolean =
    process.env.MODIFY_CLOSURE_TEST_CASE_ENABLED === 'true';

  private readonly MAX_NUMBER_OF_CLOSURE_TO_MODIFY: number =
    +process.env.MAX_NUMBER_OF_CLOSURE_TO_MODIFY;

    
  private readonly MAX_SCAN_COUNT: number = +process.env.MAX_SCAN_COUNT;

  private lastKey: string;

  private totalOfTests = 0;

  constructor(
    private readonly dataAccess: DataAccess,
    private taskCommonService: TaskCommonService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: ModifyClosureTaskService.name,
  })
  async handleTimeout() {
    const shouldRun = this.taskCommonService.checkCronJobLimit(
      ModifyClosureTaskService.name,
      this.totalOfTests,
      this.MAX_NUMBER_OF_CLOSURE_TO_MODIFY,
      this.MODIFY_CLOSURE_TEST_CASE_ENABLED,
    );
    if (!shouldRun) return;
    
    this.totalOfTests += 1;

    const dayClosureList = await this.dataAccess.getAllClosures(this.MAX_SCAN_COUNT, this.lastKey);

    dayClosureList.forEach(dc => {
      dc.closure = 0;
    });

    const lastClosure = dayClosureList[dayClosureList.length - 1];
    this.lastKey = JSON.stringify({
      PK: lastClosure.PK,
      SK: lastClosure.SK,
    });

    console.log('Users modified: ' + dayClosureList.map(dc => dc.PK).join(', '));
    
    for (const dc of dayClosureList) {
      await this.dataAccess.modifyClosure(dc);
    }
  }
}
