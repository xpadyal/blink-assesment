import { describe, it, expect } from 'vitest';
import { credentialsSchema } from '@/lib/auth';
import { authConfig } from '@/lib/auth';

describe('Auth', () => {
  it('validates credentials schema', () => {
    expect(credentialsSchema.safeParse({ email: 'a@a.com', password: 'secret1' }).success).toBe(true);
    expect(credentialsSchema.safeParse({ email: 'bad', password: '1' }).success).toBe(false);
  });
  it('uses jwt session strategy', () => {
    // @ts-expect-error NextAuth types
    expect(authConfig.session.strategy).toBe('jwt');
  });
});

