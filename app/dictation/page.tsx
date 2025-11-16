'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import data from '@emoji-mart/data';
import { useSession } from 'next-auth/react';
import { TranscriptMerger } from '@/lib/merge';
import { buildListenQuery, type DeepgramSettings } from '@/lib/deepgram-settings';
import type {
	DictationItem,
	DictationsListResponse,
	DictationCreateRequest,
	DictationAppendEmojiRequest,
	DictationUpdateResponse,
	DeepgramTokenResponse,
	ApiErrorResponse,
	DictionaryEntryItem,
	DictionaryListResponse,
} from '@/types/api';
import { isDeepgramTokenResponse } from '@/types/api';
import { DictationHistory } from '@/components/DictationHistory';
import { Toast } from '@/components/Toast';

export default function DictationPage() {
	const { data: session } = useSession();
	const [isRecording, setIsRecording] = useState(false);
	const [liveText, setLiveText] = useState('');
	const [finalText, setFinalText] = useState<string | null>(null);
	const [items, setItems] = useState<DictationItem[]>([]);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const mediaStreamRef = useRef<MediaStream | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const startedAtRef = useRef<number>(0);
	const mergerRef = useRef<TranscriptMerger>(new TranscriptMerger());
	const [showPicker, setShowPicker] = useState(false);
	const Picker = dynamic(() => import('@emoji-mart/react'), { ssr: false });
	const [textValue, setTextValue] = useState<string>('');
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const [initialLoading, setInitialLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [toast, setToast] = useState<string | null>(null);
	const [isTyping, setIsTyping] = useState(false);
	const pickerContainerRef = useRef<HTMLDivElement | null>(null);
	const userSettingsRef = useRef<DeepgramSettings | null>(null);

	useEffect(() => {
		if (!session?.user) return;
		void loadPage(0, true);
	}, [session?.user]);

	useEffect(() => {
		return () => {
			mediaRecorderRef.current?.stop();
			mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
			wsRef.current?.close();
		};
	}, []);

	async function loadPage(nextPage: number, replace = false) {
		if (replace) setInitialLoading(true);
		else setLoadingMore(true);
		const res = await fetch(`/api/dictations?page=${nextPage}&limit=10`, { cache: 'no-store' });
		if (!res.ok) {
			setInitialLoading(false);
			setLoadingMore(false);
			return;
		}
		const json = (await res.json()) as DictationsListResponse;
		setHasMore(json.hasMore);
		setPage(nextPage);
		if (replace) {
			setItems(json.items);
			setInitialLoading(false);
		} else {
			setItems((prev) => [...prev, ...json.items]);
			setLoadingMore(false);
		}
	}

	const start = async () => {
		if (isRecording) return;
		setFinalText(null);
		setLiveText('');
		setTextValue('');
		mergerRef.current = new TranscriptMerger();
		// fetch user deepgram settings once
		try {
			const s = await fetch('/api/settings/deepgram', { cache: 'no-store' }).then((r) => r.json());
			userSettingsRef.current = s ?? {};
		} catch {
			userSettingsRef.current = {};
		}
		// fetch dictionary entries and merge with keyterms
		try {
			const dictRes = await fetch('/api/dictionary', { cache: 'no-store' });
			if (dictRes.ok) {
				const dictEntries = (await dictRes.json()) as DictionaryEntryItem[];
				// Sort by weight (descending) to prioritize higher-weighted phrases
				const sortedEntries = [...dictEntries].sort((a, b) => b.weight - a.weight);
				const dictPhrases = sortedEntries
					.map((e) => e.phrase.trim())
					.filter((p) => p.length > 0 && p.length <= 64); // Deepgram keyterm max length is 64
				// merge with existing keyterms, remove duplicates, limit to 100 (Deepgram limit)
				const existingKeyterms = userSettingsRef.current?.keyterm ?? [];
				const merged = Array.from(new Set([...existingKeyterms, ...dictPhrases])).slice(0, 100);
				if (merged.length > 0) {
					userSettingsRef.current = {
						...userSettingsRef.current,
						keyterm: merged,
					};
				}
			}
		} catch {
			// ignore dictionary fetch errors, continue with settings only
		}
		// fetch ephemeral key
		const t = (await fetch('/api/deepgram/token').then((r) => r.json())) as
			| DeepgramTokenResponse
			| ApiErrorResponse;
		if (!isDeepgramTokenResponse(t)) {
			alert('Deepgram not configured');
			return;
		}
		// open websocket with mapped settings
		const qs = buildListenQuery(userSettingsRef.current);
		const ws = new WebSocket(`wss://api.deepgram.com/v1/listen?${qs}`, [
			'token',
			t.key,
		]);
		wsRef.current = ws;

		ws.onmessage = (ev) => {
			try {
				const data = JSON.parse(ev.data);
				const transcript: string | undefined = data?.channel?.alternatives?.[0]?.transcript;
				const isFinal: boolean | undefined = data?.is_final;
				if (transcript) {
					if (isFinal) {
						mergerRef.current.commitFinalSegment(transcript);
					} else {
						mergerRef.current.updatePartial(transcript);
					}
					const text = mergerRef.current.getText();
					const parts = text.split(/\s+/);
					setFinalText(parts.slice(0, -1).join(' '));
					setLiveText(parts.slice(-1).join(' '));
					const textareaFocused = document.activeElement === textareaRef.current;
					if (!textareaFocused || !isTyping) {
						setTextValue(text);
					}
				}
			} catch {
				// ignore
			}
		};

		ws.onerror = () => {
			console.error('[dictation] Deepgram websocket error');
			stop();
		};
		ws.onclose = (ev) => {
			console.warn('[dictation] Deepgram websocket closed', { code: ev.code, reason: ev.reason });
			// show a small toast so user understands why it stopped
			setToast('Connection closed. Check Settings → Transcription options.');
			setTimeout(() => setToast(null), 2000);
		};

		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		mediaStreamRef.current = stream;
		// Use Opus chunks from MediaRecorder
		const rec = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 });
		mediaRecorderRef.current = rec;
		rec.addEventListener('dataavailable', async (evt) => {
			const blob = evt.data;
			if (blob.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
				const arrayBuffer = await blob.arrayBuffer();
				wsRef.current.send(arrayBuffer);
			}
		});
		rec.start(500);
		startedAtRef.current = Date.now();
		setIsRecording(true);
	};

	const stop = async () => {
		mediaRecorderRef.current?.stop();
		mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify({ type: 'CloseStream' }));
		}
		wsRef.current?.close();
		setIsRecording(false);
		// do not auto-save; user will click Save
	};

	const onCopy = async (text: string) => {
		await navigator.clipboard.writeText(text);
	};

	async function onSave() {
		const text = textValue.trim();
		if (text.length === 0) return;
		const durationSec = startedAtRef.current
			? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
			: Math.max(1, Math.round(text.split(/\s+/).length / 2)); // rough fallback when not recording
		const res = await fetch('/api/dictations', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text, durationSec } satisfies DictationCreateRequest),
		});
		if (res.ok) {
			const created = (await res.json()) as DictationItem;
			setItems((prev) => [created, ...prev]);
			setFinalText(null);
			setLiveText('');
			setTextValue('');
			mergerRef.current = new TranscriptMerger();
			setToast('Saved');
			setTimeout(() => setToast(null), 1500);
		}
	}

	function onClear() {
		setFinalText(null);
		setLiveText('');
		setTextValue('');
		mergerRef.current = new TranscriptMerger();
		setToast('Cleared');
		setTimeout(() => setToast(null), 1000);
	}

	function insertEmojiAtCursor(emoji: string) {
		const el = textareaRef.current;
		if (!el) {
			const newLive = [liveText, emoji].filter(Boolean).join(' ');
			setLiveText(newLive);
			const combined = [finalText, newLive].filter(Boolean).join(' ');
			setTextValue(combined);
			mergerRef.current.updatePartial(combined);
			return;
		}
		const start = el.selectionStart ?? textValue.length;
		const end = el.selectionEnd ?? textValue.length;
		const before = textValue.slice(0, start);
		const after = textValue.slice(end);
		const newText = `${before}${emoji}${after}`;
		setTextValue(newText);
		mergerRef.current.updatePartial(newText);
		setTimeout(() => {
			if (textareaRef.current) {
				textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + emoji.length;
				textareaRef.current.focus();
			}
		}, 0);
	}

	async function appendEmoji(id: string, emoji: string) {
		const res = await fetch(`/api/dictations/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action: 'append_emoji',
				emoji,
			} satisfies DictationAppendEmojiRequest),
		});
		if (res.ok) {
			const updated = (await res.json()) as DictationUpdateResponse;
			setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
		}
		setShowPicker(false);
		setToast('Emoji added');
		setTimeout(() => setToast(null), 1000);
	}
	// Typing detection
	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		let typingTimer: any;
		const onKey = () => {
			setIsTyping(true);
			clearTimeout(typingTimer);
			typingTimer = setTimeout(() => setIsTyping(false), 400);
		};
		el.addEventListener('keydown', onKey);
		el.addEventListener('input', onKey);
		return () => {
			el.removeEventListener('keydown', onKey);
			el.removeEventListener('input', onKey);
			clearTimeout(typingTimer);
		};
	}, [textareaRef.current]);
	// Close picker on Escape/outside
	useEffect(() => {
		if (!showPicker) return;
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') setShowPicker(false);
		}
		function onClick(e: MouseEvent) {
			if (!pickerContainerRef.current) return;
			if (!pickerContainerRef.current.contains(e.target as Node)) {
				setShowPicker(false);
			}
		}
		document.addEventListener('keydown', onKey);
		document.addEventListener('mousedown', onClick);
		return () => {
			document.removeEventListener('keydown', onKey);
			document.removeEventListener('mousedown', onClick);
		};
	}, [showPicker]);

	return (
		<main className="max-w-3xl mx-auto p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Dictation</h1>
				<button
					onClick={isRecording ? stop : start}
					className={`rounded-full px-4 py-2 text-white ${isRecording ? 'bg-red-600' : 'bg-black'}`}
				>
					{isRecording ? 'Stop' : 'Start'}
				</button>
			</div>
			<div className="relative">
				<div className="min-h-[120px] border rounded p-0">
					<textarea
						ref={textareaRef}
						className="w-full h-40 resize-vertical outline-none p-4"
						placeholder="Dictation will appear here. You can edit before saving."
						value={textValue}
						onChange={(e) => {
							setTextValue(e.target.value);
							mergerRef.current.updatePartial(e.target.value);
						}}
						aria-label="Dictation text"
					/>
				</div>
				<div className="absolute bottom-2 right-2">
					<button
						onClick={() => setShowPicker((v) => !v)}
						className="border rounded px-2 py-1 text-xs bg-white"
						title="Insert emoji"
						aria-label="Insert emoji"
					>
						😊
					</button>
					{showPicker && (
						<div ref={pickerContainerRef} className="absolute right-0 top-full mt-2 z-10">
							<Picker
								data={data}
								onEmojiSelect={(e: any) => {
									const emoji = e?.native || '';
									if (!emoji) return;
									insertEmojiAtCursor(emoji);
									setShowPicker(false);
								}}
								theme="light"
							/>
						</div>
					)}
				</div>
			</div>
			<div className="flex items-center gap-2">
				<button
					onClick={onSave}
					disabled={textValue.trim().length === 0}
					className="border rounded px-3 py-1 disabled:opacity-50"
					aria-label="Save dictation"
				>
					Save
				</button>
				<button onClick={onClear} className="border rounded px-3 py-1" aria-label="Clear dictation">
					Clear
				</button>
			</div>
			<DictationHistory
				items={items}
				initialLoading={initialLoading}
				loadingMore={loadingMore}
				hasMore={hasMore}
				onCopy={onCopy}
				onLoadMore={() => loadPage(page + 1)}
			/>
			{toast && <Toast message={toast} />}
		</main>
	);
}

