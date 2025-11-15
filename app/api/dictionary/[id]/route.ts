import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const dictionaryUpdateSchema = z.object({
	phrase: z.string().min(1).optional(),
	weight: z.number().min(0).max(10).optional(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
	const session = await auth();
	if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const body = await req.json().catch(() => ({}));
	const parsed = dictionaryUpdateSchema.safeParse(body);
	if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
	try {
		const updated = await prisma.dictionaryEntry.update({
			where: { id: params.id, userId: session.user.id },
			data: parsed.data,
		});
		return NextResponse.json(updated);
	} catch {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
	const session = await auth();
	if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	try {
		await prisma.dictionaryEntry.delete({
			where: { id: params.id, userId: session.user.id },
		});
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}
}

