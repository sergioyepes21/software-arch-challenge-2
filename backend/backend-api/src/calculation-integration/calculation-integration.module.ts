import { Module } from "@nestjs/common";
import { AWSLambdaClosureCalculation } from "./aws-lambda-closure-calculation";
import { AWSSNSAnomalyNotifier } from "src/anomaly-notifier/aws-sns-anomaly-notifier";
import { AnomalyNotifierModule } from "src/anomaly-notifier/anomaly-notifier.module";

@Module({
  imports: [
    AnomalyNotifierModule,
  ],
  providers: [
    {
      provide: AWSLambdaClosureCalculation,
      useFactory: (
        anomalyNotifier: AWSSNSAnomalyNotifier,
      ) => {
        return new AWSLambdaClosureCalculation(
          anomalyNotifier,
        );
      },
      inject: [
        AWSSNSAnomalyNotifier,
      ]
    },
  ],
  exports: [
    AWSLambdaClosureCalculation,
  ],
})
export class CalculationIntegrationModule {}