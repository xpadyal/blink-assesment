import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import type {
	DeepgramTokenResponse,
	DeepgramTokenErrorResponse,
} from '@/types/api';

async function createEphemeralKey(
	sessionUserId: string | undefined
): Promise<DeepgramTokenResponse | DeepgramTokenErrorResponse> {
	const apiKey = process.env.DEEPGRAM_API_KEY;
	const projectId = process.env.DEEPGRAM_PROJECT_ID;
	if (!apiKey || !projectId) {
		console.error('[deepgram/token] Missing configuration', {
			hasApiKey: Boolean(apiKey),
			hasProjectId: Boolean(projectId),
		});
		return { error: 'Deepgram not configured' as const };
	}
	const redactedProject = `${projectId.slice(0, 4)}...${projectId.slice(-4)}`;
	console.log('[deepgram/token] Creating ephemeral key', {
		userId: sessionUserId ?? 'anon',
		projectId: redactedProject,
	});
	const res = await fetch(`https://api.deepgram.com/v1/projects/${projectId}/keys`, {
		method: 'POST',
		headers: {
			Authorization: `Token ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			comment: `blink-ephemeral-${sessionUserId ?? 'anon'}`,
			scopes: ['usage:write', 'listen:stream'],
			time_to_live_in_seconds: 60,
		}),
	});
	if (!res.ok) {
		const txt = await res.text();
		console.error('[deepgram/token] Deepgram API error', {
			status: res.status,
			statusText: res.statusText,
			body: txt,
		});
		return { error: `Failed: ${txt}` };
	}
	const json = await res.json();
	console.log('[deepgram/token] Ephemeral key created', {
		projectId: redactedProject,
		ttl: 60,
	});
	return { key: json?.key as string, ttl: 60 as const };
}

export async function GET(): Promise<
	NextResponse<DeepgramTokenResponse | DeepgramTokenErrorResponse>
> {
	const session = await auth();
	if (!session?.user?.id) {
		console.warn('[deepgram/token] Unauthorized request');
		return NextResponse.json<DeepgramTokenErrorResponse>(
			{ error: 'Unauthorized' },
			{ status: 401 }
		);
	}

	try {
		const result = await createEphemeralKey(session.user.id);
		if ('error' in result) {
			console.error('[deepgram/token] Failed to create ephemeral key', { error: result.error });
			return NextResponse.json<DeepgramTokenErrorResponse>(
				{ error: result.error },
				{ status: 500 }
			);
		}
		console.log('[deepgram/token] Returning ephemeral key result');
		return NextResponse.json<DeepgramTokenResponse>(result);
	} catch (e) {
		console.error('[deepgram/token] Unexpected error', {
			message: e instanceof Error ? e.message : String(e),
		});
		return NextResponse.json<DeepgramTokenErrorResponse>(
			{ error: 'Deepgram error' },
			{ status: 502 }
		);
	}
}

