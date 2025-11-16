import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type {
	ApiErrorResponse,
	DictationsListResponse,
	DictationCreateRequest,
	DictationCreateResponse,
	DictationItem,
} from '@/types/api';

export async function GET(
	req: Request
): Promise<NextResponse<DictationsListResponse | ApiErrorResponse>> {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json<ApiErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
	}
	const url = new URL(req.url);
	const page = Math.max(0, Number(url.searchParams.get('page') ?? 0) || 0);
	const limitRaw = Number(url.searchParams.get('limit') ?? 10) || 10;
	const limit = Math.min(50, Math.max(1, limitRaw));
	const dictations = await prisma.dictation.findMany({
		where: { userId: session.user.id },
		orderBy: { createdAt: 'desc' },
		take: limit,
		skip: page * limit,
	});
	const total = await prisma.dictation.count({ where: { userId: session.user.id } });
	const hasMore = (page + 1) * limit < total;
	// NextResponse.json() serializes Date to string automatically
	return NextResponse.json<DictationsListResponse>(
		{ items: dictations as unknown as DictationItem[], hasMore },
		{ status: 200 }
	);
}

const dictationCreateSchema = z.object({
	text: z.string().min(1),
	durationSec: z.number().int().min(0),
});

export async function POST(
	req: Request
): Promise<NextResponse<DictationCreateResponse | ApiErrorResponse>> {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json<ApiErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
	}
	const body = await req.json().catch(() => ({}));
	const parsed = dictationCreateSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json<ApiErrorResponse>({ error: 'Invalid input' }, { status: 400 });
	}
	const created = await prisma.dictation.create({
		data: {
			userId: session.user.id,
			text: parsed.data.text,
			durationSec: parsed.data.durationSec,
		},
	});
	// NextResponse.json() serializes Date to string automatically
	return NextResponse.json<DictationCreateResponse>(created as unknown as DictationItem, {
		status: 201,
	});
}

