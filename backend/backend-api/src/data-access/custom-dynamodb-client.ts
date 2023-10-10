import { DynamoDBClient, ResourceNotFoundException } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommandInput, PutCommand, QueryCommand, QueryCommandInput, QueryCommandOutput } from "@aws-sdk/lib-dynamodb";
import { DataAccess } from "./data-access.interface";
import { DayClosure } from "src/models/day-closure.dto";
import { Injectable } from "@nestjs/common";
import * as CryptoJS from 'crypto-js';
@Injectable()
export class CustomDynamoDBClient implements DataAccess {
  private readonly client: DynamoDBDocumentClient;

  private readonly tableName: string = process.env.TABLE_CLOSURE;

  private readonly tableChecksum: string = process.env.TABLE_CHECKSUM;
  
  private dynamoConnectionUp: boolean = true;

  private dynamoDBLocalCache: DayClosure[] = [];

  constructor() {
    this.client = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: process.env.AWS_REGION,
      }),
    );
  }

  async persistDayClosure(userID: string, transactions: number[], closure: number, tableName: string): Promise<void> {
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

    await this.persistInDynamoOrLocally(tableName, dayClosure);

  }

  private async persistInDynamoOrLocally(
    tableName: string,
    dayClosure: DayClosure,
    flushingLocalCache: boolean = false,
  ): Promise<void> {

    const putItemCommand: PutCommandInput = {
      TableName: tableName,
      Item: dayClosure,
    };
    await this.client.send(new PutCommand(putItemCommand))
      .then(async () => {
        if (!this.dynamoConnectionUp && !flushingLocalCache) {
          await this.flushLocalCache(tableName);
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

  private async flushLocalCache(
    tableName: string,
  ): Promise<void> {
    await Promise.all(
      this.dynamoDBLocalCache.map(dayClosure => this.persistInDynamoOrLocally(tableName, dayClosure, true)),
    );
    this.dynamoDBLocalCache = [];
  }

  private persistLocally(dayClosure: DayClosure): void {
    this.dynamoDBLocalCache.push(dayClosure);
  }

  async validateClosure(userID: string, date: string): Promise<string> {

    const {
      Items: dayClosureItems
    } = await this.readFromTable(this.tableName, userID, date);

    if(!dayClosureItems?.length) return 'The closure was not found for the given user';

    const closure = dayClosureItems[0].closure;
    const newHash = CryptoJS.SHA256(''+closure).toString(CryptoJS.enc.Hex);
    
    const {
      Items: checksumItems
    } = await this.readFromTable(this.tableChecksum, userID, date);

    if(!checksumItems?.length) return 'A hash was not found for the given user on the date';
    
    const oldChecksum = checksumItems[0].Checksum;

    if(oldChecksum === newHash.toString()) return 'The closure is valid';

    return 'The closure is not valid';
    
  }

  private async readFromTable(
    tableName: string,
    pk: string,
    sk: string,
  ): Promise<QueryCommandOutput> {
    const putItemCommand: QueryCommandInput = {
      TableName: tableName,
      KeyConditionExpression: `PK = :pk and begins_with(SK, :sk)`,
      ExpressionAttributeValues: {
        ':pk': `USER#${pk}`,
        ':sk': sk,
      },
    };
    return this.client.send(new QueryCommand(putItemCommand));
  }
}