import { injectable } from 'tsyringe';

import { IApplyRequest } from '../apply-request';

@injectable()
class RecordDeserializer {
  deserialize(payload: string): IApplyRequest {
    return JSON.parse(payload) as IApplyRequest;
  }
}

export { RecordDeserializer };
