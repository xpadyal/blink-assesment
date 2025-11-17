'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { deepgramSettingsSchema, type DeepgramSettings } from '@/lib/deepgram-settings';
import type {
	DeepgramSettingsGetResponse,
	DeepgramSettingsUpdateRequest,
} from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

export default function SettingsPage() {
	const { data: session } = useSession();
	const [settings, setSettings] = useState<DeepgramSettings>({ model: 'nova-2' });
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [toast, setToast] = useState<string | null>(null);

	useEffect(() => {
		if (!session?.user) return;
		setLoading(true);
		void fetch('/api/settings/deepgram', { cache: 'no-store' })
			.then((r) => r.json())
			.then((s: DeepgramSettingsGetResponse) => setSettings(s ?? {}))
			.finally(() => setLoading(false));
	}, [session?.user]);

	function setFlag<K extends keyof DeepgramSettings>(k: K) {
		return (v: boolean) => setSettings((s) => ({ ...s, [k]: v || undefined }));
	}
	const setParagraphs = (v: boolean) => {
		setSettings((s) => ({
			...s,
			paragraphs: v || undefined,
			// Paragraphs requires punctuation; turn it on automatically for UX
			punctuate: v ? true : s.punctuate,
		}));
	};
	const setUtterances = (v: boolean) => {
		setSettings((s) => ({
			...s,
			utterances: v || undefined,
			// keep utt_split only if utterances is enabled
			utt_split: v ? s.utt_split : undefined,
		}));
	};

	async function onSave() {
		const parsed = deepgramSettingsSchema.safeParse(settings);
		if (!parsed.success) {
			setToast('Invalid settings');
			setTimeout(() => setToast(null), 1200);
			return;
		}
		setSaving(true);
		const res = await fetch('/api/settings/deepgram', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(parsed.data satisfies DeepgramSettingsUpdateRequest),
		});
		setSaving(false);
		if (res.ok) {
			setToast('Saved settings');
			setTimeout(() => setToast(null), 1200);
		} else {
			setToast('Save failed');
			setTimeout(() => setToast(null), 1200);
		}
	}

	return (
		<main className="max-w-3xl mx-auto p-6 space-y-6">
			<h1 className="text-2xl font-semibold">Settings</h1>
			{loading ? (
				<p className="text-sm text-muted-foreground">Loading...</p>
			) : (
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Transcription</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label>Model</Label>
								<Select
									value={settings.model ?? 'nova-2'}
									onValueChange={(value) =>
										setSettings((s) => ({ ...s, model: value as 'nova-2' | 'nova-3' }))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="nova-2">Nova-2 (faster, no keyterms)</SelectItem>
										<SelectItem value="nova-3">Nova-3 (supports keyterms)</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground">
									{(settings.model ?? 'nova-2') === 'nova-3'
										? 'Nova-3 supports keyterms for better recognition of specific phrases.'
										: 'Nova-2 is faster but does not support keyterms. Switch to Nova-3 to use dictionary entries and keyterms.'}
								</p>
							</div>
							<Toggle
								label="Smart format"
								hint="Improves readability (punctuation, formatting for dates, numbers, etc.)."
								value={!!settings.smart_format}
								onChange={setFlag('smart_format')}
							/>
							<Toggle
								label="Punctuation"
								hint="Add punctuation and capitalization to the transcript."
								value={!!settings.punctuate}
								onChange={setFlag('punctuate')}
							/>
							<Toggle
								label="Paragraphs"
								hint="Not available for live streaming. Use Utterances for natural breaks."
								value={!!settings.paragraphs}
								onChange={setParagraphs}
								disabled
							/>
							<Toggle
								label="Utterances"
								hint="Segment speech by pauses; required for 'Utterance split'."
								value={!!settings.utterances}
								onChange={setUtterances}
							/>
							<Toggle
								label="Profanity filter"
								hint="Remove profanity from transcript."
								value={!!settings.profanity_filter}
								onChange={setFlag('profanity_filter')}
							/>
							<div className="grid grid-cols-1 gap-4">
								<LabeledInput
									label="Utterance split (ms)"
									hint="Silence duration used to split utterances (100–5000ms). Requires Utterances."
									type="number"
									value={settings.utt_split ?? ''}
									onChange={(v) => {
										if (!v) return setSettings((s) => ({ ...s, utt_split: undefined }));
										const n = Math.round(Number(v));
										if (Number.isNaN(n)) return;
										const clamped = Math.max(100, Math.min(5000, n));
										setSettings((s) => ({ ...s, utt_split: clamped, utterances: true }));
									}}
									disabled={!settings.utterances}
								/>
								<LabeledInput
									label="Keyterms (comma separated)"
									hint={
										(settings.model ?? 'nova-2') === 'nova-3'
											? 'Boost recognition of important phrases. Dictionary entries are automatically included when dictating.'
											: 'Keyterms only work with Nova-3. Switch to Nova-3 to use keyterms and dictionary entries.'
									}
									value={(settings.keyterm ?? []).join(', ')}
									onChange={(v) =>
										setSettings((s) => ({
											...s,
											keyterm: v
												? v
														.split(',')
														.map((x) => x.trim())
														.filter(Boolean)
												: undefined,
										}))
									}
									disabled={(settings.model ?? 'nova-2') === 'nova-2'}
								/>
								<LabeledInput
									label="Find & replace (find:replace, comma separated)"
									hint="Replace matched terms in transcript."
									value={(settings.replace ?? []).join(', ')}
									onChange={(v) =>
										setSettings((s) => ({
											...s,
											replace: v
												? v
														.split(',')
														.map((x) => x.trim())
														.filter(Boolean)
												: undefined,
										}))
									}
								/>
							</div>
						</CardContent>
					</Card>
					<div>
						<Button onClick={onSave} disabled={saving}>
							{saving ? 'Saving…' : 'Save settings'}
						</Button>
					</div>
				</div>
			)}
			{toast && (
				<div className="fixed bottom-4 right-4 bg-black text-white text-sm rounded px-3 py-2 shadow">
					{toast}
				</div>
			)}
		</main>
	);
}

function Toggle({
	label,
	hint,
	value,
	onChange,
	disabled = false,
}: {
	label: string;
	hint?: string;
	value: boolean;
	onChange: (v: boolean) => void;
	disabled?: boolean;
}) {
	return (
		<div className="flex items-center justify-between py-1">
			<div className="flex items-center gap-2">
				<Label htmlFor={`toggle-${label}`}>{label}</Label>
				{hint && <Tooltip text={hint} label={`${label} info`} />}
			</div>
			<Checkbox
				id={`toggle-${label}`}
				checked={value}
				onCheckedChange={(checked) => onChange(checked === true)}
				disabled={disabled}
			/>
		</div>
	);
}

function LabeledInput({
	label,
	hint,
	value,
	onChange,
	type = 'text',
	disabled = false,
}: {
	label: string;
	hint?: string;
	value: string | number;
	onChange: (v: string) => void;
	type?: string;
	disabled?: boolean;
}) {
	return (
		<div className="space-y-2">
			<Label className="flex items-center gap-2">
				{label}
				{hint && <Tooltip text={hint} label={`${label} info`} />}
			</Label>
			<Input
				type={type}
				disabled={disabled}
				value={value as any}
				onChange={(e) => onChange(e.target.value)}
			/>
		</div>
	);
}

function Tooltip({ text, label }: { text: string; label: string }) {
	return (
		<span className="relative inline-block group align-middle">
			<span
				aria-label={label}
				className="inline-flex items-center justify-center w-4 h-4 text-[10px] leading-none rounded-full border cursor-help select-none"
			>
				i
			</span>
			<span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block group-focus:block bg-black text-white text-xs rounded px-2 py-1 whitespace-pre max-w-xs z-10 shadow">
				{text}
			</span>
		</span>
	);
}



