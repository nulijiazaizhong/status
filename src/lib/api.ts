import type { HistoryData, IncidentDetail, StatusData } from './types';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
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

export function getStatus() {
  return request<StatusData>('/api/status');
}

export function getHistory(tag: string, days: number) {
  return request<HistoryData>(`/api/monitors/${encodeURIComponent(tag)}/history?days=${days}`);
}

export function getIncident(id: number) {
  return request<IncidentDetail>(`/api/incidents/${id}`);
}
