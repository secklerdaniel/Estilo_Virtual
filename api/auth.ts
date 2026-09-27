// Proxy do Neon Auth na mesma origem do app (/api/auth/*).
// Sem ele, o cookie de sessão seria de terceiros (neon.tech) e o navegador bloqueia.
// Na Vercel, /api/auth/<rota> chega aqui via rewrite do vercel.json (?path=<rota>).
import { handleAuthProxyRequest } from '@neondatabase/neon-js/auth/server';

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.searchParams.get('path') ?? url.pathname.replace(/^\/api\/auth\/?/, '');
  url.searchParams.delete('path');
  return handleAuthProxyRequest({
    request: new Request(url, {
      method: req.method,
      headers: req.headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer(),
    }),
    path,
    baseUrl: process.env.NEON_AUTH_BASE_URL!,
    cookieSecret: process.env.NEON_AUTH_COOKIE_SECRET!,
  });
}

export { handler as GET, handler as POST };
