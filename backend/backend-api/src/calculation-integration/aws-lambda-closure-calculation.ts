import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { CalculationIntegration } from "./calculation-integration.interface";
import { Injectable } from "@nestjs/common";
import { AnomalyNotifier } from "src/anomaly-notifier/anomaly-notifier";

@Injectable()
export class AWSLambdaClosureCalculation implements CalculationIntegration {
  private readonly lambdaClient: LambdaClient;

  private enabledLambdaFunctions: string[] = process.env.LAMBDA_FUNCTIONS.split(',');

  private disabledLambdaFunctions: string[] = [

  ];

  private MAX_CLOSURE_DEVIATION_PERCENTAGE = 0.05;

  constructor(
    private readonly anomalyNotifier: AnomalyNotifier,
  ) {
    this.lambdaClient = new LambdaClient({
      region: process.env.AWS_REGION     
    });
  }

  async calculateDayClosure(transactions: number[]): Promise<number> {
    
    if(this.disabledLambdaFunctions.length > 0) {
      console.log('The disabled lambda functions are:', this.disabledLambdaFunctions);
    }

    const closureResults = await Promise.all(
      this.enabledLambdaFunctions.map(async (functionName) => {
        return this.calculateDayClosureWithLambda(functionName, transactions);
      })
    );    
    
    return this.detectAnomalyAndReturnAverage(closureResults);
  }

  private async detectAnomalyAndReturnAverage(
    closureResults: number[],
  ): Promise<number> {
    // If a Lambda was already invalidated, we don't need to check for anomalies
    const average = closureResults.reduce((a, b) => a + b, 0) / closureResults.length;
    if(this.enabledLambdaFunctions.length !== 3) return average;

    let anomalyIndex = -1;
    
    for(let i = 0; i < closureResults.length; i++) {
      const deviation = Math.abs(average - closureResults[i]) / average;
      if(deviation > this.MAX_CLOSURE_DEVIATION_PERCENTAGE) {
        console.error(`The function ${this.enabledLambdaFunctions[i]} has a deviation of ${deviation}`);
        anomalyIndex = i;
        break;
      }
    }

    if(anomalyIndex === -1) return average;

    const toInactivateFunction = this.enabledLambdaFunctions[anomalyIndex];
    const msg = `The function ${toInactivateFunction} returned an incorrect response. It will be disabled.`;
    console.error(msg);
    await this.anomalyNotifier.notifyAnomaly(msg);

    this.enabledLambdaFunctions.splice(anomalyIndex, 1);
    this.disabledLambdaFunctions.push(toInactivateFunction);

    // Recalculating average without anomaly 
    closureResults.splice(anomalyIndex, 1);
    return closureResults.reduce((a, b) => a + b, 0) / closureResults.length;
  }

  private async calculateDayClosureWithLambda(functionName: string, transactions: number[]): Promise<number> {
    const {
      Payload,
      StatusCode,
    } = await this.lambdaClient.send(new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(transactions),
      InvocationType: 'RequestResponse',
    }));

    
    if (StatusCode !== 200) {
      console.error(`Failed to invoke lambda function ${functionName}`);
      return 0;
    }

    const asciiDecoder = new TextDecoder('utf-8');
    const decodedPayload = asciiDecoder.decode(Payload);
    
    const strPayload = Buffer.from(decodedPayload).toString()
    const payloadJson = JSON.parse(strPayload);

    if (payloadJson.body !== undefined && payloadJson.body !== null) {
      return payloadJson.body;
    }
    console.error("Payload is not a number:", payloadJson);
    return 0;
  }

  async enableAllCompute(): Promise<void> {
    this.enabledLambdaFunctions = process.env.LAMBDA_FUNCTIONS.split(',');
    this.disabledLambdaFunctions = [];
  }
}