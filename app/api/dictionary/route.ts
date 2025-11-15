import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function GET() {
	const session = await auth();
	if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const entries = await prisma.dictionaryEntry.findMany({
		where: { userId: session.user.id },
		orderBy: { createdAt: 'desc' },
	});
	return NextResponse.json(entries);
}

const dictionaryCreateSchema = z.object({
	phrase: z.string().min(1),
	weight: z.number().min(0).max(10).default(1),
});

export async function POST(req: Request) {
	const session = await auth();
	if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const body = await req.json().catch(() => ({}));
	const parsed = dictionaryCreateSchema.safeParse(body);
	if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
	const { phrase, weight } = parsed.data;
	const created = await prisma.dictionaryEntry.create({
		data: { userId: session.user.id, phrase, weight },
	});
	return NextResponse.json(created, { status: 201 });
}

