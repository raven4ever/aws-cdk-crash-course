#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { S3LambdaDynamodbAuditStack } from "../lib/s3-lambda-dynamodb-audit-stack";

const app = new cdk.App();

new S3LambdaDynamodbAuditStack(app, "S3LambdaDynamodbAuditStack", {});
