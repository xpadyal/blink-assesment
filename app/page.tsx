'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function HomePage() {
	const { data: session } = useSession();
	return (
		<main className="min-h-screen flex items-center justify-center">
			<div className="text-center">
				<h1 className="text-3xl font-semibold">Blink</h1>
				<p className="text-gray-600 mt-2">AI voice keyboard</p>
				{session?.user ? (
					<div className="mt-6">
						<Link href="/dictation" className="border rounded px-4 py-2">
							Start dictating
						</Link>
					</div>
				) : (
					<div className="mt-6 flex items-center justify-center gap-3">
						<Link href="/auth/signin" className="border rounded px-4 py-2">
							Sign in
						</Link>
						<Link href="/auth/signup" className="border rounded px-4 py-2">
							Sign up
						</Link>
					</div>
				)}
			</div>
		</main>
	);
}

