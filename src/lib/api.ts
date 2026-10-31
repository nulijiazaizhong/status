import type { HistoryData, IncidentDetail, StatusData } from './types';

type CacheEntry<T> = { savedAt: number; data: T };

const STATUS_CACHE_KEY = 'status-page:status:v1';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function readCache<T>(key: string): CacheEntry<T> | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    return typeof entry.savedAt === 'number' && entry.data ? entry : null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    return;
  }
}

async function request<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { headers: { Accept: 'application/json' } });
  } catch {
    throw new ApiError('无法连接状态服务，请检查网络后重试。', 0);
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message = typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'object' && body.error !== null && 'message' in body.error && typeof body.error.message === 'string'
      ? body.error.message
      : '状态服务暂时不可用，请稍后重试。';
    throw new ApiError(message, response.status);
  }
  return await response.json() as T;
}

async function cachedRequest<T extends { stale: boolean }>(key: string, ttlMs: number, producer: () => Promise<T>): Promise<T> {
  const cached = readCache<T>(key);
  if (cached && Date.now() - cached.savedAt < ttlMs) return { ...cached.data, stale: false };
  try {
    const data = await producer();
    writeCache(key, data);
    return data;
  } catch (error) {
    if (cached) return { ...cached.data, stale: true };
    throw error;
  }
}

export function getCachedStatus() {
  const cached = readCache<StatusData>(STATUS_CACHE_KEY);
  return cached ? { ...cached.data, stale: true } : null;
}

export function getStatus() {
  return cachedRequest(STATUS_CACHE_KEY, 45_000, () => request<StatusData>('/api/status'));
}

let historyQueue: Promise<unknown> = Promise.resolve();

export function getHistory(tag: string, days: number) {
  const key = `status-page:history:v1:${tag}:${days}`;
  const result = historyQueue.then(() => cachedRequest(key, 60 * 60 * 1000, () => request<HistoryData>(`/api/monitors/${encodeURIComponent(tag)}/history?days=${days}`)));
  historyQueue = result.catch(() => undefined);
  return result;
}

export function getIncident(id: number) {
  return cachedRequest(`status-page:incident:v1:${id}`, 5 * 60 * 1000, () => request<IncidentDetail>(`/api/incidents/${id}`));
}
