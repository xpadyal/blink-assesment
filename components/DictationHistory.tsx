'use client';

import type { DictationItem } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
				<p className="text-sm text-muted-foreground">Loading...</p>
			) : items.length === 0 ? (
				<p className="text-sm text-muted-foreground">No dictations yet.</p>
			) : (
				<ul className="space-y-2">
					{items.map((d) => (
						<Card key={d.id} className="group">
							<CardContent className="p-3 flex items-start justify-between">
								<p className="text-sm whitespace-pre-wrap pr-3 flex-1">{d.text}</p>
								<Button
									onClick={() => onCopy(d.text)}
									variant="ghost"
									size="sm"
									className="opacity-0 group-hover:opacity-100 transition"
									title="Copy"
									aria-label="Copy dictation"
								>
									Copy
								</Button>
							</CardContent>
						</Card>
					))}
				</ul>
			)}
			{hasMore && (
				<div>
					<Button
						onClick={onLoadMore}
						variant="outline"
						disabled={loadingMore}
						aria-label="Load more dictations"
					>
						{loadingMore ? 'Loading…' : 'Load more'}
					</Button>
				</div>
			)}
		</div>
	);
}

