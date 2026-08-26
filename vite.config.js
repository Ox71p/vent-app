import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));

function htmlInputs() {
  const input = {};
  for (const name of fs.readdirSync(root)) {
    if (name.endsWith('.html')) {
      input[path.basename(name, '.html')] = path.join(root, name);
    }
  }
  return input;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: htmlInputs(),
    },
  },
  plugins: [
    {
      name: 'vent-run-checks',
      configureServer(server) {
        const middleware = async (req, res, next) => {
          const url = (req.url || '').split('?')[0];
          if (url !== '/.netlify/functions/runChecks') {
            next();
            return;
          }

          try {
            const { handler } = await import('./netlify/functions/runChecks.mjs');
            const body = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH'
              ? await readBody(req)
              : '';
            const result = await handler({
              httpMethod: req.method,
              body: body || null,
            });
            res.statusCode = result.statusCode || 200;
            const headers = result.headers || {};
            for (const [key, value] of Object.entries(headers)) {
              res.setHeader(key, value);
            }
            res.end(result.body ?? '');
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error.message || 'runChecks failed' }));
          }
        };

        return () => {
          server.middlewares.stack.unshift({ route: '', handle: middleware });
        };
      },
    },
  ],
});
