import { describe, it, expect } from 'vitest';
import { deepgramSettingsSchema, buildListenQuery } from '@/lib/deepgram-settings';

describe('deepgram settings schema', () => {
	it('validates booleans and arrays', () => {
		const data = { keyterm: ['alpha', 'beta'], utt_split: 800, replace: ['foo:bar'], punctuate: true };
		const parsed = deepgramSettingsSchema.parse(data);
		expect(parsed.punctuate).toBe(true);
		expect(parsed.keyterm?.length).toBe(2);
	});
});

describe('buildListenQuery', () => {
	it('maps booleans and lists into querystring', () => {
		const qs = buildListenQuery({ punctuate: true, utt_split: 900, keyterm: ['a', 'b'], replace: ['x:y'] });
		expect(qs).toContain('punctuate=true');
		expect(qs).toContain('utt_split=900');
		expect(qs).toContain('keyterm=a%2Cb');
		expect(qs).toContain('replace=x%3Ay');
	});
});


