import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { deepgramSettingsSchema } from '@/lib/deepgram-settings';
import type {
	ApiErrorResponse,
	DeepgramSettingsGetResponse,
	DeepgramSettingsUpdateResponse,
} from '@/types/api';
import type { DeepgramSettings } from '@/lib/deepgram-settings';

export async function GET(): Promise<
	NextResponse<DeepgramSettingsGetResponse | ApiErrorResponse>
> {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json<ApiErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
	}
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { deepgramOptions: true },
	});
	// Prisma Json type needs to be cast to DeepgramSettings
	return NextResponse.json<DeepgramSettingsGetResponse>(
		(user?.deepgramOptions as DeepgramSettingsGetResponse) ?? {}
	);
}

export async function PATCH(
	req: Request
): Promise<NextResponse<DeepgramSettingsUpdateResponse | ApiErrorResponse>> {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json<ApiErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
	}
	const body = await req.json().catch(() => ({}));
	const parsed = deepgramSettingsSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json<ApiErrorResponse>({ error: 'Invalid input' }, { status: 400 });
	}
	const updated = await prisma.user.update({
		where: { id: session.user.id },
		data: { deepgramOptions: parsed.data },
		select: { deepgramOptions: true },
	});
	// Prisma Json type needs to be cast to DeepgramSettings
	return NextResponse.json<DeepgramSettingsUpdateResponse>(
		(updated.deepgramOptions as DeepgramSettingsUpdateResponse) ?? {}
	);
}


