#!/usr/bin/env node
import 'source-map-support/register';
import { App, StackProps, } from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure-stack';

const envSoftwareArch: StackProps = {
  env: {
    account: '012983038368',
    region: 'us-east-1'
  },
};

const app = new App();
new InfrastructureStack(app, 'InfrastructureStack', envSoftwareArch);