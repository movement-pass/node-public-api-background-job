import { injectable } from 'tsyringe';

import { KinesisStreamRecordPayload } from 'aws-lambda';

import { IApplyRequest } from '../apply-request';

@injectable()
class RecordDeserializer {
  deserialize(payload: KinesisStreamRecordPayload): IApplyRequest {
    const buffer = Buffer.from(payload.data, 'base64').toString('utf8');

    return JSON.parse(buffer) as IApplyRequest;
  }
}

export { RecordDeserializer };
