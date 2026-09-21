import type { IncomingMessage, ServerResponse } from 'node:http';
import { createSessionToken, hashPassword, verifyPassword } from '../auth.ts';
import { createSession, createUser, deleteSession, findUserByUsername } from '../db.ts';
import { getBearerToken, readJsonBody, sendJson } from '../http-utils.ts';
import type { AuthedRequest } from './middleware.ts';

interface Credentials {
  username?: unknown;
  password?: unknown;
}

function toPublicUser(user: { id: number; username: string }) {
  return { id: user.id, username: user.username };
}

export async function handleSignup(req: IncomingMessage, res: ServerResponse) {
  const body = await readJsonBody<Credentials>(req);
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || !password) {
    sendJson(res, 400, { error: 'username and password are required' });
    return;
  }

  if (findUserByUsername(username)) {
    sendJson(res, 409, { error: 'username already taken' });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const user = createUser(username, hash, salt);
  const token = createSessionToken();
  createSession(token, user.id);

  sendJson(res, 201, { token, user: toPublicUser(user) });
}

export async function handleLogin(req: IncomingMessage, res: ServerResponse) {
  const body = await readJsonBody<Credentials>(req);
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || !password) {
    sendJson(res, 400, { error: 'username and password are required' });
    return;
  }

  const user = findUserByUsername(username);
  if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
    sendJson(res, 401, { error: 'invalid username or password' });
    return;
  }

  const token = createSessionToken();
  createSession(token, user.id);

  sendJson(res, 200, { token, user: toPublicUser(user) });
}

export async function handleLogout(req: IncomingMessage, res: ServerResponse) {
  const token = getBearerToken(req);
  if (token) deleteSession(token);
  sendJson(res, 204);
}

export async function handleMe(req: AuthedRequest, res: ServerResponse) {
  sendJson(res, 200, { user: toPublicUser(req.user) });
}
