import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// No dev, serve api/<nome>.ts do mesmo jeito que a Vercel serve em produção
// (a função exporta GET/POST recebendo um Request padrão).
const apiDev = (env: Record<string, string>): Plugin => ({
  name: 'api-dev',
  configureServer(server) {
    Object.assign(process.env, env);
    server.middlewares.use('/api', async (req, res, next) => {
      const nome = req.url!.split('?')[0].split('/')[1]; // /auth/get-session -> api/auth.ts
      if (!/^[a-z-]+$/.test(nome)) return next();
      const mod = await server.ssrLoadModule(`/api/${nome}.ts`).catch(() => null);
      const handler = mod?.[req.method!];
      if (!handler) return next();
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      let r: Response;
      try {
        r = await handler(new Request(`http://${req.headers.host}/api${req.url}`, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: req.method === 'GET' ? undefined : Buffer.concat(chunks),
        }));
      } catch (e) {
        console.error(`api/${nome}:`, e); // na Vercel vira 500; aqui não derruba o servidor
        r = Response.json({ error: 'Erro interno.' }, { status: 500 });
      }
      res.statusCode = r.status;
      r.headers.forEach((v, k) => k !== 'set-cookie' && res.setHeader(k, v));
      res.setHeader('set-cookie', r.headers.getSetCookie()); // forEach juntaria os cookies num só
      res.end(Buffer.from(await r.arrayBuffer()));
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
