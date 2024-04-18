#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { FirstVpcResourcesStack } from "../lib/first-vpc-resources-stack";

const app = new cdk.App();

// read the env vars
const envName = process.env.ENV_NAME || "DEV";
const vpcId = process.env.VPC_ID || "vpc-04c9f9585508caddc";
const rdsSecretArn =
  process.env.RDS_SECRET_ARN ||
  "arn:aws:secretsmanager:us-east-1:671092559308:secret:common-infra-rds-secret-sqGnQf";
const smSecurityGroupId =
  process.env.SM_SECURITY_GROUP_ID || "sg-0570092f9764c168d";

// set the name prefix depending on the env name variable
var namePrefix = "";
if (envName === "PROD") {
  namePrefix = "rudolf";
} else {
  namePrefix = "mushroom";
}

// create the CDK Stack and pass the env vars
new FirstVpcResourcesStack(app, "FirstVpcResourcesStack", {
  env: { account: "671092559308", region: "us-east-1" },
  tags: {
    Environment: envName,
  },
  vpcId: vpcId,
  rdsSecretArn: rdsSecretArn,
  smSecurityGroupId: smSecurityGroupId,
  namePrefix: namePrefix,
});
