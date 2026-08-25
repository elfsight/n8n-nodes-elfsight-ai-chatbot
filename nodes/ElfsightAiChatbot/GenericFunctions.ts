import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

/** Machine name of the credential shipped with this package. */
export const CREDENTIALS_NAME = 'elfsightAiChatbotApi';

/** Provider slug in the Elfsight integrations API. Every route below is scoped by it. */
export const PROVIDER = 'n8n';

const DEFAULT_BASE_URL = 'https://widget-data.service.elfsight.com/api';

type ElfsightContext = IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions;

/**
 * The Elfsight API wraps every response in an envelope:
 * `{ headers, code, cookies, payload, message }`. Only `payload` carries the data,
 * so unwrap it here once instead of in every caller.
 *
 * Note the asymmetry: webhook deliveries pushed to this node are NOT wrapped —
 * they arrive as the bare conversation object.
 */
function unwrapEnvelope(response: unknown): unknown {
	if (response !== null && typeof response === 'object' && 'payload' in response) {
		return (response as IDataObject).payload;
	}

	return response;
}

/** Reads the HTTP status off whatever error shape the request helper threw. */
export function statusCodeOf(error: unknown): number | undefined {
	if (error === null || typeof error !== 'object') {
		return undefined;
	}

	const candidate = error as {
		httpCode?: string | number;
		statusCode?: number;
		response?: { status?: number; statusCode?: number };
	};

	const raw =
		candidate.httpCode ??
		candidate.statusCode ??
		candidate.response?.status ??
		candidate.response?.statusCode;

	const parsed = typeof raw === 'string' ? Number.parseInt(raw, 10) : raw;

	return Number.isNaN(parsed) ? undefined : parsed;
}

export async function elfsightApiRequest(
	this: ElfsightContext,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
): Promise<unknown> {
	const credentials = await this.getCredentials(CREDENTIALS_NAME);
	const baseUrl = ((credentials.baseUrl as string) || DEFAULT_BASE_URL).replace(/\/+$/, '');

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		headers: { 'Content-Type': 'application/json' },
		json: true,
	};

	if (body !== undefined && Object.keys(body).length > 0) {
		options.body = body;
	}

	if (qs !== undefined && Object.keys(qs).length > 0) {
		options.qs = qs;
	}

	const response = await this.helpers.httpRequestWithAuthentication.call(
		this,
		CREDENTIALS_NAME,
		options,
	);

	return unwrapEnvelope(response);
}
