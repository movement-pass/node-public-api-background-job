import { inject, injectable } from 'tsyringe';
import {
  DynamoDBDocumentClient,
  TransactWriteCommand
} from '@aws-sdk/lib-dynamodb';

import { chunk } from '../lib/chunk';
import { IPass } from '../pass';
import { Config } from '../infrastructure/config';

@injectable()
class DataLoader {
  constructor(
    @inject('DynamoDB') private readonly _dynamodb: DynamoDBDocumentClient,
    private readonly _config: Config
  ) {}

  async load(applications: IPass[]): Promise<void> {
    const { passesTable, applicantsTable } = await this._config.get();

    const tasks = chunk(applications, 12).map(async (group) => {
      const writeItems = [];

      for (const application of group) {
        writeItems.push({
          Put: {
            TableName: passesTable,
            Item: application
          }
        });

        writeItems.push({
          Update: {
            TableName: applicantsTable,
            Key: { id: application.id },
            UpdateExpression: 'SET #ac = #ac + :inc',
            ExpressionAttributeNames: {
              '#ac': 'appliedCount'
            },
            ExpressionAttributeValues: {
              ':inc': 1
            }
          }
        });
      }

      const cmd = new TransactWriteCommand({
        TransactItems: writeItems
      });

      return this._dynamodb.send(cmd);
    });

    await Promise.all(tasks);
  }
}

export { DataLoader };
