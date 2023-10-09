import { Module } from "@nestjs/common";
import { AWSSNSAnomalyNotifier } from "./aws-sns-anomaly-notifier";

@Module({
  providers: [AWSSNSAnomalyNotifier],
  exports: [AWSSNSAnomalyNotifier],
})
export class AnomalyNotifierModule {}