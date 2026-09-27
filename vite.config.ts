import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// No dev, serve api/generate.ts do mesmo jeito que a Vercel serve em produção.
const apiDev = (env: Record<string, string>): Plugin => ({
  name: 'api-dev',
  configureServer(server) {
    Object.assign(process.env, env);
    server.middlewares.use('/api/generate', async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const { POST } = await server.ssrLoadModule('/api/generate.ts');
      const r: Response = await POST(new Request('http://localhost/api/generate', {
        method: req.method, headers: { 'content-type': 'application/json' }, body: Buffer.concat(chunks),
      }));
      res.statusCode = r.status;
      res.setHeader('content-type', 'application/json');
      res.end(await r.text());
    });
  },
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), apiDev(env)],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
