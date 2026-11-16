import { describe, expect, it } from 'vitest';
import { features, version } from './version';

describe('version', () => {
  it('reports 0.19.1', async () => {
    const { version: restic } = await version();
    expect(restic).toEqual('0.19.1');
  });

  it.each([
    ['0.19.1', { walkConcurrency: false, iexcludeScopedGlob: false }],
    ['0.19.1+futo.1e904f0', { walkConcurrency: true, iexcludeScopedGlob: false }],
    ['0.19.1+futo.1', { walkConcurrency: true, iexcludeScopedGlob: false }],
    ['0.19.1+futo.2', { walkConcurrency: true, iexcludeScopedGlob: true }],
    ['0.19.1+futo.2.dev.abc1234', { walkConcurrency: true, iexcludeScopedGlob: true }],
    ['0.20.0+futo.12', { walkConcurrency: true, iexcludeScopedGlob: true }],
  ])('reports the futo flags restic %s accepts', (restic, expected) => {
    expect(features({ version: restic })).toEqual(expected);
  });
});
