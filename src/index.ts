import 'reflect-metadata';
import { container } from 'tsyringe';

import { SSMClient } from '@aws-sdk/client-ssm';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { captureAWSv3Client } from 'aws-xray-sdk';

import { SQSEvent, SQSHandler } from 'aws-lambda';

import { Processor } from './processor';

(() => {
  const region = process.env.AWS_REGION;

  const ssmClient = captureAWSv3Client(
    new SSMClient({
      region
    })
  );

  const ddbClient = captureAWSv3Client(
    new DynamoDBClient({
      region
    })
  );

  const dynamodb = DynamoDBDocumentClient.from(ddbClient);

  container.register('SSM', { useValue: ssmClient });
  container.register('DynamoDB', { useValue: dynamodb });
})();

function createHandler(processor: Processor): SQSHandler {
  return async (event: SQSEvent): Promise<void> => {
    await processor.process(event.Records);
  };
}

const handler = createHandler(container.resolve(Processor));

export { handler };
