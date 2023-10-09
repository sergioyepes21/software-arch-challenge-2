import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { AnomalyNotifier } from "./anomaly-notifier";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AWSSNSAnomalyNotifier implements AnomalyNotifier {

  private readonly snsClient: SNSClient;

  constructor() {
    this.snsClient = new SNSClient({
      region: process.env.AWS_REGION
    });
  }

  async notifyAnomaly(msg: string): Promise<void> {
    const publishCommand = new PublishCommand({
      Message: msg,
      TopicArn: process.env.SNS_ANOMALY_TOPIC,
    });
    await this.snsClient.send(publishCommand)
    .then(r => {
      console.log(`Anomaly notification sent: ${r.MessageId}`);
    })
    .catch(e => {
      console.error(`Error sending anomaly notification: ${e.message}`);
    });
  }
}