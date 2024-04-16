#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { S3CreateAndUploadAppStack } from "../lib/s3-create-and-upload-app-stack";

const app = new cdk.App();

new S3CreateAndUploadAppStack(app, "S3CreateAndUploadAppStack", {
  tags: {
    Adrian: "Komrade Kat",
  },
});
