import { DynamoDBClient, ResourceNotFoundException } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommandInput, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DataAccess } from "./data-access.interface";
import { DayClosure } from "src/models/day-closure.dto";
import { Injectable } from "@nestjs/common";
import { AnomalyNotifier } from "src/anomaly-notifier/anomaly-notifier";

@Injectable()
export class CustomDynamoDBClient implements DataAccess {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName = process.env.DYNAMODB_TABLE_NAME;

  private dynamoConnectionUp: boolean = true;

  private dynamoDBLocalCache: DayClosure[] = [];

  constructor() {
    this.client = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: process.env.AWS_REGION,
      }),
    );
  }

  async persistDayClosure(userID: string, transactions: number[], closure: number): Promise<void> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const dayClosure: DayClosure = {
      PK: `USER#${userID}`,
      SK: today.toISOString(),
      userID,
      transactions,
      closure,
      closureDate: today.toISOString(),
    };

    await this.persistInDynamoOrLocally(dayClosure);

  }

  private async persistInDynamoOrLocally(
    dayClosure: DayClosure,
    flushingLocalCache: boolean = false,
  ): Promise<void> {

    const putItemCommand: PutCommandInput = {
      TableName: this.tableName,
      Item: dayClosure,
    };
    await this.client.send(new PutCommand(putItemCommand))
      .then(() => {
        if (!this.dynamoConnectionUp && !flushingLocalCache) {

        }
      })
      .catch(e => {
        console.error(`Error al persistir el cierre del día ${dayClosure.SK} ~ e: ${e.message}`);
        if (e instanceof ResourceNotFoundException) {
          this.dynamoConnectionUp = false;
          return this.persistLocally(dayClosure);
        }
      })

  }

  private async flushLocalCache(): Promise<void> {
    await Promise.all(
      this.dynamoDBLocalCache.map(dayClosure => this.persistInDynamoOrLocally(dayClosure, true)),
    );
    this.dynamoDBLocalCache = [];
  }

  private persistLocally(dayClosure: DayClosure): void {
    this.dynamoDBLocalCache.push(dayClosure);
  }

}