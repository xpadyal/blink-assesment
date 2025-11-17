import { z } from 'zod';

export const deepgramSettingsSchema = z.object({
	model: z.enum(['nova-2', 'nova-3']).optional(),
	smart_format: z.boolean().optional(),
	punctuate: z.boolean().optional(),
	paragraphs: z.boolean().optional(),
	utterances: z.boolean().optional(),
	utt_split: z.coerce.number().int().min(100).max(5000).optional(),
	profanity_filter: z.boolean().optional(),
	keyterm: z.array(z.string().min(1).max(64)).max(50).optional(),
	replace: z.array(z.string().min(1).max(128)).max(50).optional(), // "find:replace"
});
export type DeepgramSettings = z.infer<typeof deepgramSettingsSchema>;

const allowBooleanFlags: Array<keyof DeepgramSettings> = ['smart_format', 'punctuate', 'paragraphs', 'utterances', 'profanity_filter'];

export function buildListenQuery(settings: DeepgramSettings | null | undefined): string {
	const params = new URLSearchParams();
	const model = settings?.model ?? 'nova-2';
	params.set('model', model);
	params.set('language', 'en');
	if (!settings) return params.toString();
	// paragraphs is not supported on live streaming; ignore if set
	// utt_split requires utterances; force-enable to avoid invalid combination
	if (settings.utt_split) {
		params.set('utterances', 'true');
	}
	for (const key of allowBooleanFlags) {
		const v = settings[key];
		if (v) params.set(key, 'true');
	}
	if (settings.utt_split) params.set('utt_split', String(settings.utt_split));
	// Keyterms are only supported in nova-3
	if (model === 'nova-3' && settings.keyterm?.length) {
		params.set('keyterm', settings.keyterm.join(','));
	}
	if (settings.replace?.length) for (const r of settings.replace) params.append('replace', r);
	return params.toString();
}


