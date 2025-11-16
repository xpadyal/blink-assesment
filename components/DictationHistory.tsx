'use client';

import type { DictationItem } from '@/types/api';

interface DictationHistoryProps {
	items: DictationItem[];
	initialLoading: boolean;
	loadingMore: boolean;
	hasMore: boolean;
	onCopy: (text: string) => void;
	onLoadMore: () => void;
}

export function DictationHistory({
	items,
	initialLoading,
	loadingMore,
	hasMore,
	onCopy,
	onLoadMore,
}: DictationHistoryProps) {
	return (
		<div className="space-y-3">
			<h2 className="text-lg font-medium">History</h2>
			{initialLoading ? (
				<p className="text-sm text-gray-500">Loading...</p>
			) : items.length === 0 ? (
				<p className="text-sm text-gray-500">No dictations yet.</p>
			) : (
				<ul className="space-y-2">
					{items.map((d) => (
						<li key={d.id} className="group border rounded p-3 flex items-start justify-between">
							<p className="text-sm text-gray-800 whitespace-pre-wrap pr-3">{d.text}</p>
							<div className="flex items-center gap-2">
								<button
									onClick={() => onCopy(d.text)}
									className="opacity-0 group-hover:opacity-100 transition text-xs border rounded px-2 py-1"
									title="Copy"
									aria-label="Copy dictation"
								>
									Copy
								</button>
							</div>
						</li>
					))}
				</ul>
			)}
			{hasMore && (
				<div>
					<button
						onClick={onLoadMore}
						className="border rounded px-3 py-1"
						disabled={loadingMore}
						aria-label="Load more dictations"
					>
						{loadingMore ? 'Loading…' : 'Load more'}
					</button>
				</div>
			)}
		</div>
	);
}

