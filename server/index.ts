import { createServer } from 'node:http';
import { handleLogin, handleLogout, handleMe, handleSignup } from './routes/auth.ts';
import { handleGetHistory, handleRecordGame } from './routes/games.ts';
import { requireAuth } from './routes/middleware.ts';
import { sendJson } from './http-utils.ts';

const PORT = 4000;

const routes: Record<string, (req: any, res: any) => void | Promise<void>> = {
  'POST /api/auth/signup': handleSignup,
  'POST /api/auth/login': handleLogin,
  'POST /api/auth/logout': handleLogout,
  'GET /api/auth/me': requireAuth(handleMe),
  'POST /api/games': requireAuth(handleRecordGame),
  'GET /api/games/history': requireAuth(handleGetHistory),
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const key = `${req.method} ${url.pathname}`;
  const handler = routes[key];

  if (!handler) {
    sendJson(res, 404, { error: 'not found' });
    return;
  }

  try {
    await handler(req, res);
  } catch (err) {
    console.error(`Error handling ${key}:`, err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: 'internal server error' });
    }
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`API server listening on http://127.0.0.1:${PORT}`);
});
