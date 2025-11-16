import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type {
	ApiErrorResponse,
	ApiOkResponse,
	DictationUpdateResponse,
	DictationItem,
} from '@/types/api';

export async function DELETE(
	_: Request,
	{ params }: { params: { id: string } }
): Promise<NextResponse<ApiOkResponse | ApiErrorResponse>> {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json<ApiErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
	}
	try {
		await prisma.dictation.delete({
			where: { id: params.id, userId: session.user.id },
		});
		return NextResponse.json<ApiOkResponse>({ ok: true });
	} catch {
		return NextResponse.json<ApiErrorResponse>({ error: 'Not found' }, { status: 404 });
	}
}

const patchSchema = z.object({
	action: z.literal('append_emoji'),
	emoji: z.string().min(1).max(4),
});

export async function PATCH(
	req: Request,
	{ params }: { params: { id: string } }
): Promise<NextResponse<DictationUpdateResponse | ApiErrorResponse>> {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json<ApiErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
	}
	const json = await req.json().catch(() => ({}));
	const parsed = patchSchema.safeParse(json);
	if (!parsed.success) {
		return NextResponse.json<ApiErrorResponse>({ error: 'Invalid input' }, { status: 400 });
	}
	const { emoji } = parsed.data;
	try {
		const current = await prisma.dictation.findFirst({
			where: { id: params.id, userId: session.user.id },
			select: { text: true },
		});
		if (!current) {
			return NextResponse.json<ApiErrorResponse>({ error: 'Not found' }, { status: 404 });
		}
		const updated = await prisma.dictation.update({
			where: { id: params.id },
			data: {
				text: `${current.text}${current.text.endsWith(' ') ? '' : ' '} ${emoji}`
					.replace(/\s+/g, ' ')
					.trim(),
			},
		});
		// NextResponse.json() serializes Date to string automatically
		return NextResponse.json<DictationUpdateResponse>(updated as unknown as DictationItem);
	} catch {
		return NextResponse.json<ApiErrorResponse>({ error: 'Update failed' }, { status: 500 });
	}
}

