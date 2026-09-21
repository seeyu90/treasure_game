import type { IncomingMessage, ServerResponse } from 'node:http';
import { findSessionWithUser } from '../db.ts';
import { getBearerToken, sendJson } from '../http-utils.ts';
import type { User } from '../types.ts';

export interface AuthedRequest extends IncomingMessage {
  user: User;
}

type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
type AuthedHandler = (req: AuthedRequest, res: ServerResponse) => void | Promise<void>;

export function requireAuth(handler: AuthedHandler): Handler {
  return (req, res) => {
    const token = getBearerToken(req);
    const user = token ? findSessionWithUser(token) : undefined;
    if (!user) {
      sendJson(res, 401, { error: 'not authenticated' });
      return;
    }
    (req as AuthedRequest).user = user;
    return handler(req as AuthedRequest, res);
  };
}
