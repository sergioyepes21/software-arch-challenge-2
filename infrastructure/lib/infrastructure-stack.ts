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

    // Create an EC2 instance
    const instance = new ec2.Instance(this, 'MyInstance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
    });

    // Add user data to the instance to run your Node.js application
    instance.addUserData(`
    # Install Node and Git
    yum update -y
    curl -sL https://rpm.nodesource.com/setup_10.x | bash -
    yum install -y nodejs git
    npm install -g typescript

    # Make a directory to clone the application code to
    mkdir -p /home/ec2-user/app && cd /home/ec2-user/app
    git clone https://github.com/sergioyepes21/software-arch-challenge-2.git .

    # Get inside the repository
    cd software-arch-challenge-2/backend/backend-api
    
    # Install Dependencies
    npm install --production

    # Run the application
    tsc
    npm run start:prod > stdout.log 2> stderr.log
    `); // Replace with your actual script
  }
}
