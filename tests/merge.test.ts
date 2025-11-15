import { describe, it, expect } from 'vitest';
import { TranscriptMerger } from '@/lib/merge';

describe('TranscriptMerger', () => {
  it('merges partial and final segments without duplication', () => {
    const m = new TranscriptMerger();
    m.updatePartial('Hello wo');
    expect(m.getText()).toBe('Hello wo');
    m.commitFinalSegment('Hello world');
    expect(m.getText()).toBe('Hello world');
    m.updatePartial('from');
    expect(m.getText()).toBe('Hello world from');
    m.commitFinalSegment('from Blink');
    expect(m.getText()).toBe('Hello world from Blink');
  });
});

