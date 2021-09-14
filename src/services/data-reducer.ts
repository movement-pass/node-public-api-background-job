import dayjs from 'dayjs';
import { injectable } from 'tsyringe';

import { KinesisStreamRecord } from 'aws-lambda';

import { Id } from '../lib/id';
import { IPass } from '../pass';
import { applyRequestSchema } from '../apply-request';
import { Config } from '../infrastructure/config';
import { RecordDeserializer } from '../infrastructure/record-deserializer';
import { TokenValidator } from '../infrastructure/token-validator';

@injectable()
class DataReducer {
  constructor(
    private readonly _config: Config,
    private readonly _deserializer: RecordDeserializer,
    private readonly _tokenValidator: TokenValidator
  ) {}

  async reduce(records: KinesisStreamRecord[]): Promise<IPass[]> {
    const deserializedRecords = records.map((record) =>
      this._deserializer.deserialize(record.kinesis)
    );

    const inputValidatedRecords = deserializedRecords
      .map((record) => {
        const { value, error } = applyRequestSchema.validate(record);

        if (error) {
          return undefined;
        }

        return value;
      })
      .filter((record) => !!record);

    await this._config.get();

    const validTokenRecords = (
      await Promise.all(
        inputValidatedRecords.map(async (record) => {
          const userId = await this._tokenValidator.validate(record.token);

          if (!userId) {
            return undefined;
          }

          record.applicantId = userId;

          return record;
        })
      )
    ).filter((record) => !!record);

    const transformedRecords = validTokenRecords.map((source) => {
      const target = {
        ...source,
        id: Id.generate(),
        startAt: dayjs(source.dateTime).toISOString(),
        endAt: dayjs(source.dateTime)
          .add(source.durationInHour, 'hours')
          .toISOString(),
        createdAt: dayjs().toISOString(),
        includeVehicle: !!source.includeVehicle,
        selfDriven: !!source.selfDriven,
        status: 'APPLIED'
      } as IPass;

      for (const key of ['dateTime', 'durationInHour']) {
        delete target[key];
      }

      if (!target.includeVehicle) {
        target.selfDriven = false;
        for (const key of ['vehicleNo', 'driverName', 'driverLicenseNo']) {
          delete target[key];
        }
      }

      if (target.selfDriven) {
        for (const key of ['driverName', 'driverLicenseNo']) {
          delete target[key];
        }
      }

      return target;
    });

    if (
      deserializedRecords.length !== inputValidatedRecords.length ||
      inputValidatedRecords.length !== validTokenRecords.length ||
      validTokenRecords.length !== transformedRecords.length
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        `Deserialized: ${deserializedRecords.length}, valid: ${inputValidatedRecords.length}, token: ${validTokenRecords.length}, transformed: ${transformedRecords.length}`
      );
    }

    return transformedRecords;
  }
}

export { DataReducer };
