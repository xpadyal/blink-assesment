import { auth } from '@/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function HomePage() {
	const session = await auth();
	return (
		<main className="min-h-screen flex items-center justify-center">
			<div className="text-center">
				<h1 className="text-3xl font-semibold">Blink</h1>
				<p className="text-muted-foreground mt-2">AI voice keyboard</p>
				{session?.user ? (
					<div className="mt-6">
						<Button asChild>
							<Link href="/dictation">Start dictating</Link>
						</Button>
					</div>
				) : (
					<div className="mt-6 flex items-center justify-center gap-3">
						<Button asChild variant="outline">
							<Link href="/auth/signin">Sign in</Link>
						</Button>
						<Button asChild>
							<Link href="/auth/signup">Sign up</Link>
						</Button>
					</div>
				)}
			</div>
		</main>
	);
}

