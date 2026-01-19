import { describe, expect, it } from 'vitest';
import { version } from './version';

describe('version', () => {
  it('reports 0.18.0', async () => {
    const { version: restic } = await version();
    expect(restic).toEqual('0.18.0');
  });
});
