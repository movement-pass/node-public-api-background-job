import 'reflect-metadata';

import { RecordDeserializer } from './record-deserializer';
import { IApplyRequest } from '../apply-request';

describe('RecordDeserializer', () => {
  describe('deserialize', () => {
    let res: IApplyRequest;

    beforeAll(() => {
      const deserializer = new RecordDeserializer();

      res = deserializer.deserialize('{ "token": "123" }');
    });

    it('returns deserialized object', () => {
      expect(res).toBeDefined();
      expect(res.token).toBe('123');
    });
  });
});
