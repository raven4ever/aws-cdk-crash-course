import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import * as fs from "fs";
import * as https from "https";

export class S3CreateAndUploadAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // create an S3 Bucket
    const myS3Bucket = new s3.Bucket(this, "downloaded-images-s3-bucket", { // set the context for the Stack
      bucketName: "downloaded-images-s3-bucket", // set the Bucket name
      removalPolicy: cdk.RemovalPolicy.DESTROY, // forces the Bucket to be destroyed when the Stack gets deleted
      autoDeleteObjects: true, // create a Lambda function to empty the Bucket before deletion
    });

    // create a temp folder to store the downloaded images
    const imagesFolderName = "downloaded-images";
    if (!fs.existsSync(imagesFolderName)) {
      fs.mkdirSync(imagesFolderName);
    }

    // download 5 files from https://picsum.photos/ to the temp folder
    for (let i = 0; i < 5; i++) {
      const imageUrl = `https://picsum.photos/id/${i}/500/500`;
      const imageName = `${imagesFolderName}/image-${i}.jpg`;
      const file = fs.createWriteStream(imageName);
      const request = https.get(imageUrl, (response) => {
        response.pipe(file);
      });
    }

    // create a new S3 Deployment
    new s3deploy.BucketDeployment(this, "deploy-downloaded-images", { // set the context for the Stack
      sources: [s3deploy.Source.asset(imagesFolderName)], // set the source folder where the Assets can be found to be uploaded
      destinationBucket: myS3Bucket, // set the destination Bucket
    });
  }
}
