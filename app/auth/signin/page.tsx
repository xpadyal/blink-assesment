'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';

function SignInForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [emailError, setEmailError] = useState<string | null>(null);

	useEffect(() => {
		if (searchParams.get('registered') === 'true') {
			setSuccess('Account created successfully! Please sign in.');
		}
	}, [searchParams]);

	const validateEmail = (email: string) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email) {
			setEmailError('Email is required');
			return false;
		}
		if (!emailRegex.test(email)) {
			setEmailError('Please enter a valid email address');
			return false;
		}
		setEmailError(null);
		return true;
	};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setEmailError(null);

		if (!validateEmail(email)) {
			return;
		}
		if (!password) {
			setError('Password is required');
			return;
		}
		if (password.length < 6) {
			setError('Password must be at least 6 characters');
			return;
		}

		setLoading(true);
		try {
			const res = await signIn('credentials', {
				email: email.trim().toLowerCase(),
				password,
				redirect: false,
			});
			if (res?.error) {
				setError('Invalid email or password');
			} else if (res?.ok) {
				router.push('/');
				router.refresh();
			}
		} catch (err) {
			setError('An error occurred. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="min-h-screen flex items-center justify-center p-6">
			<div className="w-full max-w-sm space-y-4">
				<h1 className="text-2xl font-semibold">Sign in</h1>
				<form onSubmit={onSubmit} className="space-y-3">
					<div>
						<input
							className={`w-full border rounded px-3 py-2 ${
								emailError ? 'border-red-500' : ''
							}`}
							placeholder="Email"
							type="email"
							value={email}
							onChange={(e) => {
								setEmail(e.target.value);
								setEmailError(null);
								setError(null);
							}}
							onBlur={(e) => validateEmail(e.target.value)}
							required
						/>
						{emailError && (
							<p className="text-xs text-red-600 mt-1">{emailError}</p>
						)}
					</div>
					<div>
						<input
							className="w-full border rounded px-3 py-2"
							placeholder="Password"
							type="password"
							value={password}
							onChange={(e) => {
								setPassword(e.target.value);
								setError(null);
							}}
							required
						/>
					</div>
					{success && (
						<div className="bg-green-50 border border-green-200 rounded px-3 py-2">
							<p className="text-sm text-green-600">{success}</p>
						</div>
					)}
					{error && (
						<div className="bg-red-50 border border-red-200 rounded px-3 py-2">
							<p className="text-sm text-red-600">{error}</p>
						</div>
					)}
					<button
						type="submit"
						disabled={loading}
						className="w-full bg-black text-white rounded px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Signing in…' : 'Sign in'}
					</button>
				</form>
				<p className="text-sm text-gray-600">
					Don't have an account?{' '}
					<Link className="underline" href="/auth/signup">
						Sign up
					</Link>
				</p>
			</div>
		</main>
	);
}

export default function SignInPage() {
	return (
		<Suspense fallback={
			<main className="min-h-screen flex items-center justify-center p-6">
				<div className="w-full max-w-sm">
					<h1 className="text-2xl font-semibold">Sign in</h1>
					<p className="text-gray-600 mt-2">Loading...</p>
				</div>
			</main>
		}>
			<SignInForm />
		</Suspense>
	);
}

