import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
	const session = await auth();
	if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	try {
		await prisma.dictation.delete({
			where: { id: params.id, userId: session.user.id },
		});
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}
}

const patchSchema = z.object({
	action: z.literal('append_emoji'),
	emoji: z.string().min(1).max(4),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
	const session = await auth();
	if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const json = await req.json().catch(() => ({}));
	const parsed = patchSchema.safeParse(json);
	if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
	const { emoji } = parsed.data;
	try {
		const current = await prisma.dictation.findFirst({
			where: { id: params.id, userId: session.user.id },
			select: { text: true },
		});
		if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });
		const updated = await prisma.dictation.update({
			where: { id: params.id },
			data: { text: `${current.text}${current.text.endsWith(' ') ? '' : ' '} ${emoji}`.replace(/\s+/g, ' ').trim() },
		});
		return NextResponse.json(updated);
	} catch {
		return NextResponse.json({ error: 'Update failed' }, { status: 500 });
	}
}

