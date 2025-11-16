import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import type { ApiErrorResponse, RegisterResponse } from '@/types/api';

const registerSchema = z.object({
	name: z.string().min(1),
	email: z.string().email(),
	password: z.string().min(6),
});

export async function POST(
	req: Request
): Promise<NextResponse<RegisterResponse | ApiErrorResponse>> {
	try {
		const body = await req.json();
		const parsed = registerSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json<ApiErrorResponse>({ error: 'Invalid input' }, { status: 400 });
		}
		const { name, email, password } = parsed.data;

		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) {
			return NextResponse.json<ApiErrorResponse>(
				{ error: 'Email already in use' },
				{ status: 409 }
			);
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const user = await prisma.user.create({
			data: { name, email, hashedPassword },
			select: { id: true, name: true, email: true },
		});
		return NextResponse.json<RegisterResponse>(user, { status: 201 });
	} catch (err) {
		return NextResponse.json<ApiErrorResponse>({ error: 'Server error' }, { status: 500 });
	}
}

