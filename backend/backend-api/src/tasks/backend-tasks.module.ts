import { Module } from "@nestjs/common";
import { HttpModule, HttpService } from '@nestjs/axios';
import { DayClosureTestCaseTaskService } from "./day-closure-test-case-task.service";
import { RecordSigningTaskService } from "./record-signing-task.service";
import { TaskCommonService } from "./task-common.service";
import { DataAccessModule } from "src/data-access/data-access.module";
import { CustomDynamoDBClient } from "src/data-access/custom-dynamodb-client";
import { ModifyClosureTaskService } from "./modify-closure-task.service";
import { ValidateClosureTaskService } from "./validate-closure-task.service";

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: () => ({
        baseURL: process.env.BACKEND_API_URL,
      }),
    }),
    DataAccessModule,
  ],
  providers: [
    DayClosureTestCaseTaskService,
    TaskCommonService,
    {
      provide: RecordSigningTaskService,
      useFactory: (
        da: CustomDynamoDBClient,
        tcs: TaskCommonService
      ) => new RecordSigningTaskService(da, tcs),
      inject: [
        CustomDynamoDBClient,
        TaskCommonService,
      ]
    },
    // {
    //   provide: ModifyClosureTaskService,
    //   useFactory: (
    //     da: CustomDynamoDBClient,
    //     tcs: TaskCommonService
    //   ) => new ModifyClosureTaskService(da, tcs),
    //   inject: [
    //     CustomDynamoDBClient,
    //     TaskCommonService,
    //   ]
    // },
    {
      provide: ValidateClosureTaskService,
      useFactory: (
        da: CustomDynamoDBClient,
        tcs: TaskCommonService,
        httpService: HttpService,
      ) => new ValidateClosureTaskService(da, tcs, httpService),
      inject: [
        CustomDynamoDBClient,
        TaskCommonService,
        HttpService,
      ]
    },
  ]
})
export class BackendTasksModule{}