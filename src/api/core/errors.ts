import { AppwriteException } from 'appwrite';
import { z } from 'zod';

/**
 * Every failure the data layer can produce, collapsed into the handful of cases the UI treats differently.
 * Callers branch on `kind`; they never need to inspect Appwrite's error codes themselves.
 */
export type ApiErrorKind =
    /** The row or file doesn't exist (or isn't visible to the current user). */
    | 'not_found'
    /** No valid session: signed out, or the session expired. */
    | 'unauthorized'
    /** Signed in, but not allowed to do this. */
    | 'forbidden'
    /** A uniqueness rule was broken, or the data changed since it was loaded. */
    | 'conflict'
    | 'rate_limited'
    /** The input was rejected, by our own validation or by Appwrite's. `fieldErrors` says where. */
    | 'invalid_input'
    /** Appwrite returned data that doesn't match the schema the app expects. */
    | 'invalid_data'
    | 'network'
    /** Env vars are missing or malformed, so no request can be made. */
    | 'misconfigured'
    | 'unknown';

export class ApiError extends Error {
    readonly kind: ApiErrorKind;
    /** HTTP status from Appwrite, when there was a response. */
    readonly status?: number;
    /** Appwrite's machine-readable error type, e.g. `row_not_found`. */
    readonly type?: string;
    /** Per-field messages for `invalid_input`, keyed by field name. */
    readonly fieldErrors: Record<string, string>;

    constructor(
        kind: ApiErrorKind,
        message: string,
        options: { cause?: unknown; status?: number; type?: string; fieldErrors?: Record<string, string> } = {}
    ) {
        super(message, { cause: options.cause });
        this.name = 'ApiError';
        this.kind = kind;
        this.status = options.status;
        this.type = options.type;
        this.fieldErrors = options.fieldErrors ?? {};
    }
}

const kindFromStatus = (status: number): ApiErrorKind => {
    if (status === 0) return 'network';
    if (status === 400) return 'invalid_input';
    if (status === 401) return 'unauthorized';
    if (status === 403) return 'forbidden';
    if (status === 404) return 'not_found';
    if (status === 409) return 'conflict';
    if (status === 429) return 'rate_limited';
    return 'unknown';
};

const isNetworkFailure = (error: unknown) =>
    // fetch() rejects with a TypeError when the request never got a response (offline, DNS, CORS).
    error instanceof TypeError && /fetch|network|load failed/i.test(error.message);

/** Keyed by the first path segment, so `tags.2` reports against `tags`. */
export const fieldErrorsFromZod = (error: z.ZodError): Record<string, string> => {
    const fieldErrors: Record<string, string> = {};

    for (const issue of error.issues) {
        const field = String(issue.path[0] ?? '');
        fieldErrors[field] ??= issue.message;
    }

    return fieldErrors;
};

/** Normalizes anything thrown inside the data layer into an `ApiError`. */
export function toApiError(error: unknown, context?: string): ApiError {
    if (error instanceof ApiError) {
        return error;
    }

    const prefix = context ? `${context}: ` : '';

    if (error instanceof AppwriteException) {
        return new ApiError(kindFromStatus(error.code), `${prefix}${error.message}`, {
            cause: error,
            status: error.code,
            type: error.type,
        });
    }

    if (error instanceof z.ZodError) {
        return new ApiError('invalid_input', error.issues[0]?.message ?? 'Invalid input', {
            cause: error,
            fieldErrors: fieldErrorsFromZod(error),
        });
    }

    if (isNetworkFailure(error)) {
        return new ApiError('network', `${prefix}${(error as Error).message}`, { cause: error });
    }

    return new ApiError('unknown', `${prefix}${error instanceof Error ? error.message : String(error)}`, {
        cause: error,
    });
}

/** Runs `operation`, rethrowing any failure as an `ApiError` labelled with `context`. */
export async function withApiErrors<T>(context: string, operation: () => Promise<T>): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        throw toApiError(error, context);
    }
}

export const isApiError = (error: unknown, kind?: ApiErrorKind): error is ApiError =>
    error instanceof ApiError && (kind === undefined || error.kind === kind);

/** Kinds whose message was written for the user (by our own validation) rather than by Appwrite. */
const SELF_DESCRIBING_KINDS: ApiErrorKind[] = ['invalid_input', 'conflict'];

const FRIENDLY_MESSAGES: Record<ApiErrorKind, string> = {
    not_found: "That item doesn't exist anymore. It may have been deleted.",
    unauthorized: 'Your session has expired. Sign in again.',
    forbidden: "You don't have permission to do that.",
    conflict: 'That conflicts with data that already exists.',
    rate_limited: 'Too many requests. Wait a moment and try again.',
    invalid_input: 'Some of the values are invalid.',
    invalid_data: 'The server returned data in an unexpected format.',
    network: "Couldn't reach the server. Check your connection and try again.",
    misconfigured: "The site isn't configured correctly, so it can't load its data.",
    unknown: 'Something went wrong. Try again.',
};

/** A sentence that is safe to show in the UI for any thrown value. */
export function getErrorMessage(error: unknown): string {
    const apiError = toApiError(error);

    // Appwrite's own 400/409 messages ("Document with the requested ID already exists") read poorly;
    // only trust messages for these kinds when they came from our validation (no HTTP status).
    if (SELF_DESCRIBING_KINDS.includes(apiError.kind) && apiError.status === undefined && apiError.message) {
        return apiError.message;
    }

    return FRIENDLY_MESSAGES[apiError.kind];
}

/** Whether retrying the same request could plausibly succeed. */
export const isRetryable = (error: unknown) => {
    const { kind, status } = toApiError(error);
    return kind === 'network' || kind === 'rate_limited' || (status !== undefined && status >= 500);
};

/** Per-field messages to show next to form inputs, or `{}`. */
export const getFieldErrors = (error: unknown): Record<string, string> =>
    error ? toApiError(error).fieldErrors : {};
