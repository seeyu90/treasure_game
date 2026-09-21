export interface PublicUser {
  id: number;
  username: string;
}

export type GameResultOutcome = 'win' | 'lose' | 'tie';

export interface GameHistoryEntry {
  id: number;
  score: number;
  result: GameResultOutcome;
  created_at: string;
}

async function parseJsonOrThrow(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function signup(username: string, password: string) {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return parseJsonOrThrow(res) as Promise<{ token: string; user: PublicUser }>;
}

export async function login(username: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return parseJsonOrThrow(res) as Promise<{ token: string; user: PublicUser }>;
}

export async function logout(token: string) {
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function me(token: string) {
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJsonOrThrow(res) as Promise<{ user: PublicUser }>;
}

export async function recordGame(
  token: string,
  game: { score: number; result: GameResultOutcome },
) {
  const res = await fetch('/api/games', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(game),
  });
  return parseJsonOrThrow(res) as Promise<{ id: number; created_at: string }>;
}

export async function fetchHistory(token: string) {
  const res = await fetch('/api/games/history', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJsonOrThrow(res) as Promise<{ games: GameHistoryEntry[] }>;
}
