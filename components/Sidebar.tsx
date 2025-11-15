'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import clsx from 'clsx';

const links = [
	{ href: '/', label: 'Home' },
	{ href: '/dictation', label: 'Dictation' },
	{ href: '/dictionary', label: 'Dictionary' },
	{ href: '/settings', label: 'Settings' },
];

export function Sidebar() {
	const pathname = usePathname();
	const { data: session } = useSession();
	return (
		<aside className="w-60 shrink-0 h-screen border-r p-4 sticky top-0">
			<div className="font-semibold text-lg mb-6">Blink</div>
			<nav className="space-y-1">
				{links.map((l) => (
					<Link
						key={l.href}
						href={l.href}
						className={clsx(
							'block rounded px-3 py-2 hover:bg-gray-100',
							pathname === l.href && 'bg-gray-100 font-medium'
						)}
					>
						{l.label}
					</Link>
				))}
			</nav>
			<div className="mt-6 text-sm text-gray-600">
				{session?.user ? (
					<div className="space-y-2">
						<p className="truncate">Signed in as {session.user.email}</p>
						<button onClick={() => signOut()} className="border rounded px-3 py-1">
							Sign out
						</button>
					</div>
				) : (
					<Link className="border rounded px-3 py-1 inline-block" href="/auth/signin">
						Sign in
					</Link>
				)}
			</div>
		</aside>
	);
}

