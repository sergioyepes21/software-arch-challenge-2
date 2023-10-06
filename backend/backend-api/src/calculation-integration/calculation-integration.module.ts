import { Module } from "@nestjs/common";
import { AWSLambdaClosureCalculation } from "./aws-lambda-closure-calculation";

@Module({
  providers: [
    AWSLambdaClosureCalculation,
  ],
  exports: [
    AWSLambdaClosureCalculation,
  ],
})
export class CalculationIntegrationModule {}