'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>Sign in</CardTitle>
					<CardDescription>Enter your credentials to access your account</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="Email"
								value={email}
								onChange={(e) => {
									setEmail(e.target.value);
									setEmailError(null);
									setError(null);
								}}
								onBlur={(e) => validateEmail(e.target.value)}
								required
								className={emailError ? 'border-destructive' : ''}
							/>
							{emailError && (
								<p className="text-xs text-destructive mt-1">{emailError}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								placeholder="Password"
								value={password}
								onChange={(e) => {
									setPassword(e.target.value);
									setError(null);
								}}
								required
							/>
						</div>
						{success && (
							<Alert>
								<AlertDescription>{success}</AlertDescription>
							</Alert>
						)}
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						<Button type="submit" disabled={loading} className="w-full">
							{loading ? 'Signing in…' : 'Sign in'}
						</Button>
					</form>
					<p className="text-sm text-muted-foreground mt-4 text-center">
						Don't have an account?{' '}
						<Link className="underline hover:text-foreground" href="/auth/signup">
							Sign up
						</Link>
					</p>
				</CardContent>
			</Card>
		</main>
	);
}

export default function SignInPage() {
	return (
		<Suspense fallback={
			<main className="min-h-screen flex items-center justify-center p-6">
				<Card className="w-full max-w-sm">
					<CardHeader>
						<CardTitle>Sign in</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground">Loading...</p>
					</CardContent>
				</Card>
			</main>
		}>
			<SignInForm />
		</Suspense>
	);
}

