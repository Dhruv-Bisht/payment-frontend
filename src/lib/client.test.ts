import { ApiError, isRetrySafe, request, setUnauthorizedHandler, shouldRetryQuery } from './client';

afterEach(() => {
  vi.restoreAllMocks();
  setUnauthorizedHandler(null);
  sessionStorage.clear();
});

const respond = (status: number, body: unknown) =>
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify(body), { status }));

describe('api client', () => {
  it('maps a network failure to ApiError status 0', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'));
    await expect(request('/x')).rejects.toMatchObject({ status: 0, code: 'NETWORK' });
  });

  it('surfaces the server error code and message', async () => {
    respond(422, { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient wallet balance' });
    await expect(request('/x')).rejects.toMatchObject({ status: 422, code: 'INSUFFICIENT_BALANCE' });
  });

  it('signs the user out on 401 for authenticated calls only', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    respond(401, { message: 'nope' });
    await expect(request('/x')).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledTimes(1);
    await expect(request('/login', { auth: false })).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('only auto-retries payments for failures that are safe to repeat', () => {
    expect(isRetrySafe(new ApiError(0, 'NETWORK', ''))).toBe(true);
    expect(isRetrySafe(new ApiError(503, undefined, ''))).toBe(true);
    expect(isRetrySafe(new ApiError(409, 'CONCURRENT_UPDATE', ''))).toBe(true);
    expect(isRetrySafe(new ApiError(422, 'INSUFFICIENT_BALANCE', ''))).toBe(false);
    expect(isRetrySafe(new ApiError(400, 'VALIDATION_ERROR', ''))).toBe(false);
  });

  it('retries reads on server errors but not on client errors', () => {
    expect(shouldRetryQuery(0, new ApiError(500, undefined, ''))).toBe(true);
    expect(shouldRetryQuery(2, new ApiError(500, undefined, ''))).toBe(false);
    expect(shouldRetryQuery(0, new ApiError(404, undefined, ''))).toBe(false);
  });
});
