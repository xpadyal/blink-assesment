import { NextResponse } from 'next/server';

export async function GET() {
	try {
		return NextResponse.json(
			{
				status: 'ok',
				timestamp: new Date().toISOString(),
				environment: process.env.NODE_ENV,
				port: process.env.PORT || 'not set',
				nextauthUrl: process.env.NEXTAUTH_URL || 'not set',
				hasDatabaseUrl: !!process.env.DATABASE_URL,
			},
			{ status: 200 }
		);
	} catch (error) {
		return NextResponse.json(
			{
				status: 'error',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

