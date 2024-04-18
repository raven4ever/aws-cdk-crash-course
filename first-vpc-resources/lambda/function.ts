import {
    GetSecretValueCommand,
    SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { Handler } from "aws-cdk-lib/aws-lambda";
import * as fs from "fs";
import { Client } from "pg";

// create a new Secrets Manager client
const smClient = new SecretsManagerClient();
// get the RDS secret
const secretArn = process.env.RDS_SECRET_ARN;

export const lambda_handler: Handler = async (
    event: any,
    context: any,
): Promise<any> => {
    // get the RDS secret
    const secretArn = process.env.RDS_SECRET_ARN;
    const response = await smClient.send(
        new GetSecretValueCommand({
            SecretId: secretArn,
        }),
    );

    // parse the secret
    const secretJSON = JSON.parse(response.SecretString!);

    // create the PostgreSQL client
    const pgClient = new Client({
        host: secretJSON["host"],
        port: secretJSON["port"],
        database: secretJSON["dbname"],
        user: secretJSON["username"],
        password: secretJSON["password"],
    });

    // connect to the PostgreSQL database
    try {
        await pgClient.connect();
    } catch (error) {
        console.log(error);
    }

    const state = event["state"];

    if (state == "reset") {
        // load the create script
        const createScript = fs.readFileSync("create.sql", "utf8");

        await pgClient.query(`DROP TABLE IF EXISTS animals;`);

        await pgClient.query(createScript);

        return {
            reset: "OK",
        };
    }

    if (state == "insert") {
        const res = await pgClient.query(
            `INSERT INTO animals (name, color) VALUES ($1, $2) returning *;`,
            [event["data"]["name"], event["data"]["color"]],
        );

        return {
            insert: res.rows[0],
        };
    }

    if (state == "all") {
        const res = await pgClient.query("SELECT * FROM animals;");

        return {
            all: res.rows,
        };
    }
};
