'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

import type {
	DictionaryEntryItem as Entry,
	DictionaryListResponse,
	DictionaryCreateRequest,
	DictionaryUpdateRequest,
} from '@/types/api';

export default function DictionaryPage() {
	const [entries, setEntries] = useState<Entry[]>([]);
	const [phrase, setPhrase] = useState('');
	const [weight, setWeight] = useState(1);

	const load = async () => {
		const r = await fetch('/api/dictionary');
		if (r.ok) {
			const data = (await r.json()) as DictionaryListResponse;
			setEntries(data);
		}
	};

	useEffect(() => {
		void load();
	}, []);

	const add = async () => {
		if (!phrase.trim()) return;
		const r = await fetch('/api/dictionary', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				phrase: phrase.trim(),
				weight,
			} satisfies DictionaryCreateRequest),
		});
		if (r.ok) {
			setPhrase('');
			setWeight(1);
			void load();
		}
	};

	const update = async (id: string, data: DictionaryUpdateRequest) => {
		const r = await fetch(`/api/dictionary/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		if (r.ok) void load();
	};

	const remove = async (id: string) => {
		const r = await fetch(`/api/dictionary/${id}`, { method: 'DELETE' });
		if (r.ok) setEntries((prev) => prev.filter((e) => e.id !== id));
	};

	return (
		<main className="max-w-3xl mx-auto p-6 space-y-6">
			<h1 className="text-2xl font-semibold">Dictionary</h1>
			<Card>
				<CardContent className="p-4 space-y-3">
					<div className="flex gap-2">
						<Input
							className="flex-1"
							placeholder="Phrase"
							value={phrase}
							onChange={(e) => setPhrase(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									void add();
								}
							}}
						/>
						<Input
							type="number"
							min={0}
							max={10}
							step={0.1}
							className="w-28"
							placeholder="Weight"
							value={weight}
							onChange={(e) => setWeight(Number(e.target.value))}
						/>
						<Button onClick={add}>Add</Button>
					</div>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Phrase</TableHead>
								<TableHead className="w-32">Weight</TableHead>
								<TableHead className="w-28">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{entries.map((e) => (
								<TableRow key={e.id}>
									<TableCell>
										<Input
											className="w-full"
											defaultValue={e.phrase}
											onBlur={(ev) => update(e.id, { phrase: ev.target.value })}
										/>
									</TableCell>
									<TableCell>
										<Input
											type="number"
											min={0}
											max={10}
											step={0.1}
											className="w-24"
											defaultValue={e.weight}
											onBlur={(ev) => update(e.id, { weight: Number(ev.target.value) })}
										/>
									</TableCell>
									<TableCell>
										<Button
											onClick={() => remove(e.id)}
											variant="destructive"
											size="sm"
										>
											Delete
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</main>
	);
}

