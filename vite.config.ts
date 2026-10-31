import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Connect } from 'vite';
import { pathToFileURL } from 'node:url';

function edgeFunctions(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    if (!req.url?.startsWith('/api/') || req.method !== 'GET') return next();

    const url = new URL(req.url, 'http://localhost');
    const routes: Array<[RegExp, string, string]> = [
      [/^\/api\/status$/, '../../edge-functions/api/status.js', 'status'],
      [/^\/api\/incidents\/(\d+)$/, '../../edge-functions/api/incidents/[id].js', 'incident'],
      [/^\/api\/monitors\/([a-z0-9_-]+)\/history$/, '../../edge-functions/api/monitors/[tag]/history.js', 'history'],
    ];
    const route = routes.find(([pattern]) => pattern.test(url.pathname));
    if (!route) return next();

    try {
      const match = url.pathname.match(route[0]);
      const module = await import(pathToFileURL(`${process.cwd()}/${route[1].replace('../../', '')}`).href);
      const request = new Request(url, { method: 'GET', headers: req.headers as HeadersInit });
      const response: Response = await module.onRequestGet({
        request,
        env: process.env,
        params: route[2] === 'incident' ? { id: match?.[1] } : route[2] === 'history' ? { tag: match?.[1] } : {},
        waitUntil: (promise: Promise<unknown>) => void promise.catch(() => undefined),
      });
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      next(error instanceof Error ? error : new Error('Edge Function failed'));
    }
  };
}

export default defineConfig({
  plugins: [sveltekit(), { name: 'local-edge-functions', configureServer: (server) => { server.middlewares.use(edgeFunctions()); } }],
});
