import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

interface FirstVpcResourcesStackProps extends cdk.StackProps {
  vpcId: string;
  rdsSecretArn: string;
  namePrefix: string;
  smSecurityGroupId: string;
}

export class FirstVpcResourcesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FirstVpcResourcesStackProps) {
    super(scope, id, props);

    const prefix = props.namePrefix.toLowerCase();

    const lambdaRoleName = `${prefix}-lambda-role`;
    const lambdaFunctionSGName = `${prefix}-lambda-sg`;
    const lambdaFunctionName = `${prefix}-lambda`;

    // create IAM Role for Lambda
const lambdaRole = new iam.Role(this, lambdaRoleName, {
  roleName: lambdaRoleName,
  assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
});

// add basic permissions
lambdaRole.addManagedPolicy(
  iam.ManagedPolicy.fromAwsManagedPolicyName(
    "service-role/AWSLambdaBasicExecutionRole",
  ),
);
lambdaRole.addManagedPolicy(
  iam.ManagedPolicy.fromAwsManagedPolicyName(
    "service-role/AWSLambdaVPCAccessExecutionRole",
  ),
);

    // get VPC from lookup
const vpc = ec2.Vpc.fromLookup(this, "existing-vpc", {
  vpcId: props.vpcId,
});

    // create Lambda security group
const lambdaSecurityGroup = new ec2.SecurityGroup(
  this,
  lambdaFunctionSGName,
  {
    securityGroupName: lambdaFunctionSGName,
    vpc: vpc,
    allowAllOutbound: false,
    disableInlineRules: true,
  },
);

lambdaSecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(5432));
lambdaSecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));

    // lookup RDS secret and grant read permissions to the Lambda role
const rdsSecret = sm.Secret.fromSecretCompleteArn(
  this,
  "rds-secret",
  props.rdsSecretArn,
);
// grant read permissions to the Lambda role
rdsSecret.grantRead(lambdaRole);

// lookup SM endpoint SG
const smEndpointSG = ec2.SecurityGroup.fromSecurityGroupId(
  this,
  "sm-endpoint-sg",
  props.smSecurityGroupId,
);

    // create the Lambda function
const myLambda = new lambdanode.NodejsFunction(this, lambdaFunctionName, {
  functionName: lambdaFunctionName,
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: "lambda_handler",
  entry: "lambda/function.ts",
  role: lambdaRole,
  securityGroups: [lambdaSecurityGroup, smEndpointSG],
  vpc: vpc,
  vpcSubnets: {
    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    onePerAz: true,
  },
  environment: {
    RDS_SECRET_ARN: props.rdsSecretArn,
  },
  bundling: {
    commandHooks: {
      afterBundling: (inputDir: string, outputDir: string): string[] => [
        `cp ${inputDir}/lambda/create.sql ${outputDir}`,
      ],
      beforeBundling: (inputDir: string, outputDir: string): string[] => [],
      beforeInstall: (inputDir: string, outputDir: string): string[] => [],
    },
    nodeModules: ["pg"],
  },
});
  }
}
