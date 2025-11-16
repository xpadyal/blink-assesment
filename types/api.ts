import type { Dictation, DictionaryEntry, User } from '@prisma/client';
import type { DeepgramSettings } from '@/lib/deepgram-settings';

export interface ApiErrorResponse {
	error: string;
}

export interface ApiOkResponse {
	ok: true;
}

export type DictationItem = Pick<Dictation, 'id' | 'text' | 'durationSec'> & {
	createdAt: string;
};

export interface DictationsListResponse {
	items: DictationItem[];
	hasMore: boolean;
}

export interface DictationCreateRequest {
	text: string;
	durationSec: number;
}

export type DictationCreateResponse = DictationItem;

export interface DictationAppendEmojiRequest {
	action: 'append_emoji';
	emoji: string;
}

export type DictationUpdateResponse = DictationItem;

export type DictationDeleteResponse = ApiOkResponse;

export type DictionaryEntryItem = Pick<DictionaryEntry, 'id' | 'phrase' | 'weight'> & {
	createdAt: string;
};

export type DictionaryListResponse = DictionaryEntryItem[];

export interface DictionaryCreateRequest {
	phrase: string;
	weight?: number;
}

export type DictionaryCreateResponse = DictionaryEntryItem;

export interface DictionaryUpdateRequest {
	phrase?: string;
	weight?: number;
}

export type DictionaryUpdateResponse = DictionaryEntryItem;

export type DictionaryDeleteResponse = ApiOkResponse;

export type DeepgramSettingsGetResponse = DeepgramSettings;

export type DeepgramSettingsUpdateRequest = DeepgramSettings;

export type DeepgramSettingsUpdateResponse = DeepgramSettings;

export interface RegisterRequest {
	name: string;
	email: string;
	password: string;
}

export type RegisterResponse = Pick<User, 'id' | 'name' | 'email'>;

export interface DeepgramTokenResponse {
	key: string;
	ttl: 60;
}

export interface DeepgramTokenErrorResponse {
	error: string;
}

export function isApiErrorResponse(response: unknown): response is ApiErrorResponse {
	return (
		typeof response === 'object' &&
		response !== null &&
		'error' in response &&
		typeof (response as ApiErrorResponse).error === 'string'
	);
}

export function isDeepgramTokenResponse(
	response: unknown
): response is DeepgramTokenResponse {
	return (
		typeof response === 'object' &&
		response !== null &&
		'key' in response &&
		typeof (response as DeepgramTokenResponse).key === 'string' &&
		'ttl' in response &&
		(response as DeepgramTokenResponse).ttl === 60
	);
}
