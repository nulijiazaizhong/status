import { withCache } from '../lib/cache.js';
import { errorResponse, methodNotAllowed } from '../lib/http.js';
import { getStatus } from '../lib/status-data.js';

export async function onRequestGet(context) {
  try {
    return await withCache(context, 45, 86400, () => getStatus(context.env));
  } catch (error) {
    return errorResponse(error);
  }
}

export function onRequest() {
  return methodNotAllowed();
}
