import { injectable } from 'tsyringe';
import { KinesisStreamRecord } from 'aws-lambda';

import { DataReducer } from './services/data-reducer';
import { DataLoader } from './services/data-loader';

@injectable()
class Processor {
  constructor(
    private readonly _dataReducer: DataReducer,
    private readonly _dataLoader: DataLoader
  ) {}

  async process(records: KinesisStreamRecord[]): Promise<void> {
    const applications = await this._dataReducer.reduce(records);

    await this._dataLoader.load(applications);
  }
}

export { Processor };
