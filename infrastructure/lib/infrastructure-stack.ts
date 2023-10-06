import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';



export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC (Virtual Private Cloud)
    const vpc = new ec2.Vpc(this, 'MyVpc', {
      maxAzs: 2, // Specify the number of availability zones
    });
    const mySG = new ec2.SecurityGroup(this, `MySecurityGroup`, {
      vpc: vpc,
      description: 'CDK Security Group',
      allowAllOutbound: true,
    });
    mySG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3000), '3000 from anywhere');
    mySG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), '22 from anywhere');

    // Create an EC2 instance
    const instance = new ec2.Instance(this, 'MyInstance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.genericLinux({
        'us-west-1': 'ami-0f8e81a3da6e2510a', // Ubuntu Free Tier
      }),
      associatePublicIpAddress: true, // Allow this instance to be accessed through the Internet
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      }
    });

    instance.addSecurityGroup(mySG);

    // Add user data to the instance to run your Node.js application
    instance.addUserData(`
    #!/bin/bash
    # Update the package list
    sudo apt update -y
    sudo apt install -y curl
  
    # Install Node.js and npm
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
    source ~/.bashrc
    nvm install v18.18.0
  
    # Install TypeScript globally
    sudo npm install -g typescript@4.9.5
  
    # Install Git
    sudo apt install -y git
    
    # Create a directory for the application code
    mkdir software-arch-challenge-2
  
    # Change to the application code directory
    cd software-arch-challenge-2
  
    # Clone the repository (replace with your repository URL)
    git clone https://github.com/sergioyepes21/software-arch-challenge-2.git .
    cd backend/backend-api

    # Install Dependencies
    sudo npm install --only=production 
    # Build the TypeScript application
    sudo tsc
    sudo npm run start:prod > stdout.log 2> stderr.log
    `);
  }
}
