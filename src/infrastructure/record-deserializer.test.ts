import 'reflect-metadata';

import { KinesisStreamRecordPayload } from 'aws-lambda';

import { RecordDeserializer } from './record-deserializer';
import { IApplyRequest } from '../apply-request';

describe('RecordDeserializer', () => {
  describe('deserialize', () => {
    let res: IApplyRequest;

    beforeAll(() => {
      const deserializer = new RecordDeserializer();

      res = deserializer.deserialize({
        data: Buffer.from('{ "token": "123" }').toString('base64')
      } as KinesisStreamRecordPayload);
    });

    it('returns deserialized object', () => {
      expect(res).toBeDefined();
      expect(res.token).toBe('123');
    });
  });
});
