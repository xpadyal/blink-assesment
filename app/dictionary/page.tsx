'use client';

import { useEffect, useState } from 'react';

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
			<div className="border rounded p-4 space-y-3">
				<div className="flex gap-2">
					<input
						className="flex-1 border rounded px-3 py-2"
						placeholder="Phrase"
						value={phrase}
						onChange={(e) => setPhrase(e.target.value)}
					/>
					<input
						type="number"
						min={0}
						max={10}
						step={0.1}
						className="w-28 border rounded px-3 py-2"
						placeholder="Weight"
						value={weight}
						onChange={(e) => setWeight(Number(e.target.value))}
					/>
					<button onClick={add} className="border rounded px-3 py-2">
						Add
					</button>
				</div>
				<table className="w-full text-left text-sm">
					<thead>
						<tr className="text-gray-600">
							<th className="py-2">Phrase</th>
							<th className="py-2 w-32">Weight</th>
							<th className="py-2 w-28">Actions</th>
						</tr>
					</thead>
					<tbody>
						{entries.map((e) => (
							<tr key={e.id} className="border-t">
								<td className="py-2">
									<input
										className="w-full border rounded px-2 py-1"
										defaultValue={e.phrase}
										onBlur={(ev) => update(e.id, { phrase: ev.target.value })}
									/>
								</td>
								<td className="py-2">
									<input
										type="number"
										min={0}
										max={10}
										step={0.1}
										className="w-24 border rounded px-2 py-1"
										defaultValue={e.weight}
										onBlur={(ev) => update(e.id, { weight: Number(ev.target.value) })}
									/>
								</td>
								<td className="py-2">
									<button onClick={() => remove(e.id)} className="border rounded px-2 py-1">
										Delete
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</main>
	);
}

