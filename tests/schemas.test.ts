import { describe, it, expect } from 'vitest';
import { registerSchema } from '@/app/api/auth/register/route';
import { dictationCreateSchema } from '@/app/api/dictations/route';
import { dictionaryCreateSchema, } from '@/app/api/dictionary/route';
import { dictionaryUpdateSchema } from '@/app/api/dictionary/[id]/route';

describe('Schemas', () => {
  it('validates register schema', () => {
    expect(registerSchema.safeParse({ name: 'A', email: 'a@a.com', password: 'secret1' }).success).toBe(true);
    expect(registerSchema.safeParse({ name: '', email: 'bad', password: '1' }).success).toBe(false);
  });

  it('validates dictation create schema', () => {
    expect(dictationCreateSchema.safeParse({ text: 'hi', durationSec: 5 }).success).toBe(true);
    expect(dictationCreateSchema.safeParse({ text: '', durationSec: -1 }).success).toBe(false);
  });

  it('validates dictionary create/update schemas', () => {
    expect(dictionaryCreateSchema.safeParse({ phrase: 'Blink', weight: 1.2 }).success).toBe(true);
    expect(dictionaryCreateSchema.safeParse({ phrase: '', weight: -1 }).success).toBe(false);
    expect(dictionaryUpdateSchema.safeParse({ phrase: 'New' }).success).toBe(true);
    expect(dictionaryUpdateSchema.safeParse({ weight: 100 }).success).toBe(false);
  });
});

