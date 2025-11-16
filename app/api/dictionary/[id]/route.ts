import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type {
	ApiErrorResponse,
	ApiOkResponse,
	DictionaryUpdateRequest,
	DictionaryUpdateResponse,
	DictionaryDeleteResponse,
	DictionaryEntryItem,
} from '@/types/api';

const dictionaryUpdateSchema = z.object({
	phrase: z.string().min(1).optional(),
	weight: z.number().min(0).max(10).optional(),
});

export async function PUT(
	req: Request,
	{ params }: { params: { id: string } }
): Promise<NextResponse<DictionaryUpdateResponse | ApiErrorResponse>> {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json<ApiErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
	}
	const body = await req.json().catch(() => ({}));
	const parsed = dictionaryUpdateSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json<ApiErrorResponse>({ error: 'Invalid input' }, { status: 400 });
	}
	try {
		const updated = await prisma.dictionaryEntry.update({
			where: { id: params.id, userId: session.user.id },
			data: parsed.data,
		});
		// NextResponse.json() serializes Date to string automatically
		return NextResponse.json<DictionaryUpdateResponse>(updated as unknown as DictionaryEntryItem);
	} catch {
		return NextResponse.json<ApiErrorResponse>({ error: 'Not found' }, { status: 404 });
	}
}

export async function DELETE(
	_: Request,
	{ params }: { params: { id: string } }
): Promise<NextResponse<DictionaryDeleteResponse | ApiErrorResponse>> {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json<ApiErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
	}
	try {
		await prisma.dictionaryEntry.delete({
			where: { id: params.id, userId: session.user.id },
		});
		return NextResponse.json<DictionaryDeleteResponse>({ ok: true });
	} catch {
		return NextResponse.json<ApiErrorResponse>({ error: 'Not found' }, { status: 404 });
	}
}

