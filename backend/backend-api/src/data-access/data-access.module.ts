import { Module } from "@nestjs/common";
import { CustomDynamoDBClient } from "./custom-dynamodb-client";

@Module({
  providers: [
    CustomDynamoDBClient,
  ],
  exports: [
    CustomDynamoDBClient,
  ],
})
export class DataAccessModule { }