'use client';

interface ToastProps {
	message: string;
}

export function Toast({ message }: ToastProps) {
	return (
		<div className="fixed bottom-4 right-4 bg-black text-white text-sm rounded px-3 py-2 shadow">
			{message}
		</div>
	);
}

