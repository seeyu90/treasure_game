import type { ServerResponse } from 'node:http';
import { insertGameResult, listGameResultsByUser } from '../db.ts';
import { readJsonBody, sendJson } from '../http-utils.ts';
import type { GameResultOutcome } from '../types.ts';
import type { AuthedRequest } from './middleware.ts';

interface RecordGameBody {
  score?: unknown;
  result?: unknown;
}

const VALID_RESULTS: GameResultOutcome[] = ['win', 'lose', 'tie'];

export async function handleRecordGame(req: AuthedRequest, res: ServerResponse) {
  const body = await readJsonBody<RecordGameBody>(req);
  const score = typeof body.score === 'number' ? body.score : NaN;
  const result = body.result as GameResultOutcome;

  if (!Number.isFinite(score) || !VALID_RESULTS.includes(result)) {
    sendJson(res, 400, { error: 'score (number) and result (win|lose|tie) are required' });
    return;
  }

  const row = insertGameResult(req.user.id, score, result);
  sendJson(res, 201, { id: row.id, created_at: row.created_at });
}

export async function handleGetHistory(req: AuthedRequest, res: ServerResponse) {
  const games = listGameResultsByUser(req.user.id);
  sendJson(res, 200, { games });
}
