import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function SettingsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	if (!session?.user) {
		redirect('/auth/signin?callbackUrl=/settings');
	}
	return <>{children}</>;
}

