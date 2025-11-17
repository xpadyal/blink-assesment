'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignUpPage() {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<{
		name?: string;
		email?: string;
		password?: string;
	}>({});
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const validateForm = () => {
		const errors: { name?: string; email?: string; password?: string } = {};
		let isValid = true;

		if (!name.trim()) {
			errors.name = 'Name is required';
			isValid = false;
		} else if (name.trim().length < 2) {
			errors.name = 'Name must be at least 2 characters';
			isValid = false;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email.trim()) {
			errors.email = 'Email is required';
			isValid = false;
		} else if (!emailRegex.test(email.trim())) {
			errors.email = 'Please enter a valid email address';
			isValid = false;
		}

		if (!password) {
			errors.password = 'Password is required';
			isValid = false;
		} else if (password.length < 6) {
			errors.password = 'Password must be at least 6 characters';
			isValid = false;
		}

		setFieldErrors(errors);
		return isValid;
	};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setFieldErrors({});

		if (!validateForm()) {
			return;
		}

		setLoading(true);
		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: name.trim(),
					email: email.trim().toLowerCase(),
					password,
				}),
			});

			const data = await res.json().catch(() => ({}));

			if (res.ok) {
				router.push('/auth/signin?registered=true');
				return;
			}

			if (res.status === 409) {
				setError('An account with this email already exists. Please sign in instead.');
			} else if (res.status === 400) {
				setError(data.error || 'Please check your input and try again.');
			} else {
				setError(data.error || 'Failed to create account. Please try again.');
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
					<CardTitle>Sign up</CardTitle>
					<CardDescription>Create a new account to get started</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								type="text"
								placeholder="Name"
								value={name}
								onChange={(e) => {
									setName(e.target.value);
									setFieldErrors((prev) => ({ ...prev, name: undefined }));
									setError(null);
								}}
								required
								className={fieldErrors.name ? 'border-destructive' : ''}
							/>
							{fieldErrors.name && (
								<p className="text-xs text-destructive mt-1">{fieldErrors.name}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="Email"
								value={email}
								onChange={(e) => {
									setEmail(e.target.value);
									setFieldErrors((prev) => ({ ...prev, email: undefined }));
									setError(null);
								}}
								required
								className={fieldErrors.email ? 'border-destructive' : ''}
							/>
							{fieldErrors.email && (
								<p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								placeholder="Password (min. 6 characters)"
								value={password}
								onChange={(e) => {
									setPassword(e.target.value);
									setFieldErrors((prev) => ({ ...prev, password: undefined }));
									setError(null);
								}}
								required
								className={fieldErrors.password ? 'border-destructive' : ''}
							/>
							{fieldErrors.password && (
								<p className="text-xs text-destructive mt-1">
									{fieldErrors.password}
								</p>
							)}
						</div>
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						<Button type="submit" disabled={loading} className="w-full">
							{loading ? 'Creating account…' : 'Create account'}
						</Button>
					</form>
					<p className="text-sm text-muted-foreground mt-4 text-center">
						Already have an account?{' '}
						<Link className="underline hover:text-foreground" href="/auth/signin">
							Sign in
						</Link>
					</p>
				</CardContent>
			</Card>
		</main>
	);
}

