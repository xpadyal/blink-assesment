import { describe, it, expect, vi } from 'vitest';
import { createEphemeralKey } from '@/app/api/deepgram/token/route';

describe('Deepgram ephemeral key', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns error if not configured', async () => {
    delete process.env.DEEPGRAM_API_KEY;
    delete process.env.DEEPGRAM_PROJECT_ID;
    const res = await createEphemeralKey('u1');
    expect('error' in res).toBe(true);
  });

  it('returns key on success', async () => {
    process.env.DEEPGRAM_API_KEY = 'x';
    process.env.DEEPGRAM_PROJECT_ID = 'p';
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ key: 'temp_abc' }),
      text: async () => '',
    } as any);
    const res = await createEphemeralKey('u1');
    expect(res).toEqual({ key: 'temp_abc', ttl: 60 });
  });
});

