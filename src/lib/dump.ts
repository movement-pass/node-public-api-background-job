import { inspect } from 'util';

const dump = (payload: unknown): string =>
  inspect(payload, { showHidden: false, depth: undefined });

export { dump };
