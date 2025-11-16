import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type {
	ApiErrorResponse,
	DictionaryListResponse,
	DictionaryCreateRequest,
	DictionaryCreateResponse,
	DictionaryEntryItem,
} from '@/types/api';

export async function GET(): Promise<NextResponse<DictionaryListResponse | ApiErrorResponse>> {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json<ApiErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
	}
	const entries = await prisma.dictionaryEntry.findMany({
		where: { userId: session.user.id },
		orderBy: { createdAt: 'desc' },
	});
	// NextResponse.json() serializes Date to string automatically
	return NextResponse.json<DictionaryListResponse>(entries as unknown as DictionaryEntryItem[]);
}

const dictionaryCreateSchema = z.object({
	phrase: z.string().min(1),
	weight: z.number().min(0).max(10).default(1),
});

export async function POST(
	req: Request
): Promise<NextResponse<DictionaryCreateResponse | ApiErrorResponse>> {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json<ApiErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
	}
	const body = await req.json().catch(() => ({}));
	const parsed = dictionaryCreateSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json<ApiErrorResponse>({ error: 'Invalid input' }, { status: 400 });
	}
	const { phrase, weight } = parsed.data;
	const created = await prisma.dictionaryEntry.create({
		data: { userId: session.user.id, phrase, weight },
	});
	// NextResponse.json() serializes Date to string automatically
	return NextResponse.json<DictionaryCreateResponse>(
		created as unknown as DictionaryEntryItem,
		{ status: 201 }
	);
}

