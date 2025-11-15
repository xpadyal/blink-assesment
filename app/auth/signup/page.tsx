'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
			<div className="w-full max-w-sm space-y-4">
				<h1 className="text-2xl font-semibold">Sign up</h1>
				<form onSubmit={onSubmit} className="space-y-3">
					<div>
						<input
							className={`w-full border rounded px-3 py-2 ${
								fieldErrors.name ? 'border-red-500' : ''
							}`}
							placeholder="Name"
							type="text"
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								setFieldErrors((prev) => ({ ...prev, name: undefined }));
								setError(null);
							}}
							required
						/>
						{fieldErrors.name && (
							<p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>
						)}
					</div>
					<div>
						<input
							className={`w-full border rounded px-3 py-2 ${
								fieldErrors.email ? 'border-red-500' : ''
							}`}
							placeholder="Email"
							type="email"
							value={email}
							onChange={(e) => {
								setEmail(e.target.value);
								setFieldErrors((prev) => ({ ...prev, email: undefined }));
								setError(null);
							}}
							required
						/>
						{fieldErrors.email && (
							<p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
						)}
					</div>
					<div>
						<input
							className={`w-full border rounded px-3 py-2 ${
								fieldErrors.password ? 'border-red-500' : ''
							}`}
							placeholder="Password (min. 6 characters)"
							type="password"
							value={password}
							onChange={(e) => {
								setPassword(e.target.value);
								setFieldErrors((prev) => ({ ...prev, password: undefined }));
								setError(null);
							}}
							required
						/>
						{fieldErrors.password && (
							<p className="text-xs text-red-600 mt-1">
								{fieldErrors.password}
							</p>
						)}
					</div>
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
						{loading ? 'Creating account…' : 'Create account'}
					</button>
				</form>
				<p className="text-sm text-gray-600">
					Already have an account?{' '}
					<Link className="underline" href="/auth/signin">
						Sign in
					</Link>
				</p>
			</div>
		</main>
	);
}

