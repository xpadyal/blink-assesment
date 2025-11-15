import { PrismaAdapter } from '@auth/prisma-adapter';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { prisma } from './prisma';
import { z } from 'zod';

export const credentialsSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
});

export const authConfig: NextAuthConfig = {
	adapter: PrismaAdapter(prisma),
	session: { strategy: 'jwt' },
	trustHost: process.env.NODE_ENV === 'development' || !!process.env.NEXTAUTH_URL,
	providers: [
		Credentials({
			name: 'Credentials',
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			authorize: async (raw) => {
				try {
					const parsed = credentialsSchema.safeParse(raw);
					if (!parsed.success) {
						return null;
					}
					const { email, password } = parsed.data;
					const user = await prisma.user.findUnique({ where: { email } });
					if (!user) {
						return null;
					}
					if (!user.hashedPassword) {
						return null;
					}
					const ok = await bcrypt.compare(password, user.hashedPassword);
					if (!ok) {
						return null;
					}
					return {
						id: user.id,
						name: user.name ?? null,
						email: user.email,
						image: user.image ?? null,
					};
				} catch (error) {
					return null;
				}
			},
		}),
	],
	pages: {
		signIn: '/auth/signin',
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user?.id) token.uid = user.id;
			return token;
		},
		async session({ session, token }) {
			if (session.user && token.uid) {
				
				session.user.id = token.uid as string;
			}
			return session;
		},
	},
}


