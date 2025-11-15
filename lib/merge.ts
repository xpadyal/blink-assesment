export class TranscriptMerger {
	private committedWords: string[] = [];
	private partial: string = '';

	commitFinalSegment(segment: string) {
		const words = segment.trim().split(/\s+/);
		this.committedWords.push(...words);
		this.partial = '';
	}

	updatePartial(segment: string) {
		this.partial = segment;
	}

	getText(): string {
		const base = this.committedWords.join(' ');
		return [base, this.partial].filter(Boolean).join(' ').trim();
	}
}


