import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { deepgramSettingsSchema } from '@/lib/deepgram-settings';

export async function GET() {
	const session = await auth();
	if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { deepgramOptions: true },
	});
	return NextResponse.json(user?.deepgramOptions ?? {});
}

export async function PATCH(req: Request) {
	const session = await auth();
	if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const body = await req.json().catch(() => ({}));
	const parsed = deepgramSettingsSchema.safeParse(body);
	if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
	const updated = await prisma.user.update({
		where: { id: session.user.id },
		data: { deepgramOptions: parsed.data },
		select: { deepgramOptions: true },
	});
	return NextResponse.json(updated.deepgramOptions ?? {});
}


