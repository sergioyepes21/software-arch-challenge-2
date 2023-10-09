import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataAccessModule } from './data-access/data-access.module';
import { CustomDynamoDBClient } from './data-access/custom-dynamodb-client';
import { CalculationIntegrationModule } from './calculation-integration/calculation-integration.module';
import { CalculationIntegration } from './calculation-integration/calculation-integration.interface';
import { ConfigModule } from '@nestjs/config';
import { AWSLambdaClosureCalculation } from './calculation-integration/aws-lambda-closure-calculation';
import { AnomalyNotifierModule } from './anomaly-notifier/anomaly-notifier.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AnomalyNotifierModule,
    DataAccessModule,
    CalculationIntegrationModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: AppService,
      useFactory: (
        calculationIntegration: AWSLambdaClosureCalculation,
        dataAccess: CustomDynamoDBClient,
      ) => new AppService(calculationIntegration, dataAccess),
      inject: [
        AWSLambdaClosureCalculation,
        CustomDynamoDBClient,
      ]
    }
  ],
})
export class AppModule { }
