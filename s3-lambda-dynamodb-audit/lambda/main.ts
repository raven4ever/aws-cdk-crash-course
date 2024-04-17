import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { Handler } from "aws-cdk-lib/aws-lambda";
import { randomUUID } from "crypto";

// create a nre DynamoDB client
const dynamodbClient = new DynamoDBClient();
// get the DynamoDB audit table name
const auditTableName = process.env.AUDIT_TABLE_NAME;

export const handler: Handler = async (
  event: any,
  context: any,
): Promise<any> => {
  // print the invoking event
  console.log(event);

  // store all promises generated by the DynamoDB client
  const allRecordsPromises = [];

  // the triggering event can contain multiple uploaded records which need to be inserted in the DynamoDB Table
  for (const record of event["Records"]) {
    console.log(record);

    // create the template for the Item
    const putCommand = new PutItemCommand({
      TableName: auditTableName,
      Item: {
        id: {
          S: randomUUID(),
        },
        eventName: {
          S: record["eventName"],
        },
        timestamp: {
          N: Date.now().toString(),
        },
        object_key: {
          S: record["s3"]["object"]["key"],
        },
        object_etag: {
          S: record["s3"]["object"]["eTag"],
        },
      },
    });

    // send the Item to the DynamoDBClient
    // add the promise to the allpromises list
    allRecordsPromises.push(dynamodbClient.send(putCommand));
  }

  // wait for all promises resolutions
  const records = Promise.all(allRecordsPromises);

  return records;
};
