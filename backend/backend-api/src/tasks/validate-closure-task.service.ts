import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataAccess } from 'src/data-access/data-access.interface';
import { TaskCommonService } from './task-common.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
@Injectable()
export class ValidateClosureTaskService {
  private readonly VALIDATE_CLOSURE_TEST_CASE_ENABLED: boolean =
    process.env.VALIDATE_CLOSURE_TEST_CASE_ENABLED === 'true';

  private readonly MAX_NUMBER_OF_CLOSURE_TO_VALIDATE: number =
    +process.env.MAX_NUMBER_OF_CLOSURE_TO_VALIDATE;

  private readonly MAX_SCAN_COUNT: number = +process.env.MAX_SCAN_COUNT;

  private lastKey: string;

  private totalOfTests = 0;

  constructor(
    private readonly dataAccess: DataAccess,
    private taskCommonService: TaskCommonService,
    private readonly httpService: HttpService,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS, {
    name: ValidateClosureTaskService.name,
  })
  async handleTimeout() {
    const shouldRun = this.taskCommonService.checkCronJobLimit(
      ValidateClosureTaskService.name,
      this.totalOfTests,
      this.MAX_NUMBER_OF_CLOSURE_TO_VALIDATE,
      this.VALIDATE_CLOSURE_TEST_CASE_ENABLED,
    );
    if (!shouldRun) return;

    this.totalOfTests += 1;

    const dayClosureList = await this.dataAccess.getAllClosures(
      this.MAX_SCAN_COUNT,
      this.lastKey,
    );

    const validClosures: string[] = [];

    for (const dc of dayClosureList) {
      const { data: response } = await firstValueFrom(
        this.httpService.post(
          '/validate-closure',
          {
            date: dc.SK,
          },
          {
            headers: {
              'x-userid': dc.PK.split('#')[1],
            },
          },
        ),
      );

      if (response === "The closure is valid") {
        validClosures.push(dc.PK);
      }
    }

    if(validClosures.length > 0) {
      console.log('Items válidos: ' + validClosures.join(', '));
    } else {
      console.log('Todos los items son inválidos');
    }

    dayClosureList.forEach((dc) => {
      dc.closure = 0;
    });

    const lastClosure = dayClosureList[dayClosureList.length - 1];
    this.lastKey = JSON.stringify({
      PK: lastClosure.PK,
      SK: lastClosure.SK,
    });
  }
}
