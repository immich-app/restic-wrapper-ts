import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { describe, expect, it, vi } from 'vitest';
import { JsonLinesReader } from './streams';

describe('JsonLinesReader', () => {
  it('reads JSON lines', async () => {
    const cb = vi.fn();
    await pipeline([Readable.from('{"hello": 1}\n{"world": 2}'), new JsonLinesReader(cb)]);

    expect(cb).toHaveBeenNthCalledWith(1, { hello: 1 });
    expect(cb).toHaveBeenNthCalledWith(2, { world: 2 });
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('throws errors with invalid JSON (_write)', async () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    async function* data() {
      yield '{"hello": 1}\n{"world":}\n';
      await new Promise((resolve) => setImmediate(resolve));
      yield '{"rest": 3}';
    }

    const cb = vi.fn();

    await expect(pipeline([Readable.from(data()), new JsonLinesReader(cb)])).rejects.toThrowError();

    expect(cb).toHaveBeenNthCalledWith(1, { hello: 1 });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('throws errors with invalid JSON (_final)', async () => {
    const cb = vi.fn();

    await expect(pipeline([Readable.from('{"hello": 1}\n{"world":}'), new JsonLinesReader(cb)])).rejects.toThrowError();

    expect(cb).toHaveBeenNthCalledWith(1, { hello: 1 });
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
