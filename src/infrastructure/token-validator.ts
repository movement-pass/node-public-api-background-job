import { injectable } from 'tsyringe';
import { verify } from 'jsonwebtoken';

import { Config } from './config';
import { dump } from '../lib/dump';

@injectable()
class TokenValidator {
  constructor(private readonly _config: Config) {}

  async validate(token: string): Promise<string> {
    const { jwtSecret, domain } = await this._config.get();

    return new Promise((resolve) => {
      verify(
        token,
        jwtSecret,
        { issuer: domain, audience: domain },
        (err, decoded) => {
          if (err) {
            // eslint-disable-next-line no-console
            console.error(`Token validation: ${dump(err)}`);
            return resolve(undefined);
          }

          resolve(decoded.id);
        }
      );
    });
  }
}

export { TokenValidator };
