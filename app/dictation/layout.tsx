import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function DictationLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	if (!session?.user) {
		redirect('/auth/signin?callbackUrl=/dictation');
	}
	return <>{children}</>;
}

