import { Module } from "@nestjs/common";
import { CustomDynamoDBClient } from "./custom-dynamodb-client";
import { AnomalyNotifierModule } from "src/anomaly-notifier/anomaly-notifier.module";
import { AWSSNSAnomalyNotifier } from "src/anomaly-notifier/aws-sns-anomaly-notifier";

@Module({
  providers: [
   CustomDynamoDBClient,
  ],
  exports: [
    CustomDynamoDBClient,
  ],
})
export class DataAccessModule { }