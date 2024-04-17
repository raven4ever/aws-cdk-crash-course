import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdasource from "aws-cdk-lib/aws-lambda-event-sources";
import * as nodeLambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class S3LambdaDynamodbAuditStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // create the S3 Bucket
    const s3Bucket = new s3.Bucket(this, "audit-items-processing-bucket", {
      bucketName: "audit-items-processing-bucket",
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // create the DynamoDB Table for Audit
    const auditDynamoTable = new dynamodb.Table(
      this,
      "audit-processed-items-table",
      {
        tableName: "audit-processed-items-table",
        partitionKey: {
          name: "id",
          type: dynamodb.AttributeType.STRING,
        },
      },
    );

    // create the IAM Role for the Lambda function
    const lambdaRole = new iam.Role(this, "audit-processing-lambda-role", {
      roleName: "audit-processing-lambda-role",
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    // add basic Lambda execution permissions to the Lambda role
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole",
      ),
    );

    // allow the IAM role to write to the audit Table
    auditDynamoTable.grantWriteData(lambdaRole);

    // create the Lambda function
    const processingLambda = new nodeLambda.NodejsFunction(
      this,
      "audit-processing-lambda-function",
      {
        functionName: "audit-processing-lambda-function",
        role: lambdaRole,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handler",
        entry: "./lambda/main.ts",
        environment: {
          AUDIT_TABLE_NAME: auditDynamoTable.tableName,
        },
      },
    );

    // trigger the processing Lambda whenever a new object is created in the bucket
    processingLambda.addEventSource(
      new lambdasource.S3EventSource(s3Bucket, {
        events: [s3.EventType.OBJECT_CREATED],
      }),
    );
  }
}
