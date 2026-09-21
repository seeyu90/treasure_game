import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { GameResult, GameResultOutcome, Session, User } from './types.ts';

const DB_PATH = join(import.meta.dirname, 'data', 'game.db');
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS game_results (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    score      INTEGER NOT NULL,
    result     TEXT NOT NULL CHECK (result IN ('win', 'lose', 'tie')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export function createUser(username: string, hash: string, salt: string): User {
  const stmt = db.prepare(
    'INSERT INTO users (username, password_hash, password_salt) VALUES (?, ?, ?) RETURNING *',
  );
  return stmt.get(username, hash, salt) as unknown as User;
}

export function findUserByUsername(username: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as
    | User
    | undefined;
}

export function findUserById(id: number): User | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

export function createSession(token: string, userId: number): Session {
  const stmt = db.prepare(
    'INSERT INTO sessions (token, user_id) VALUES (?, ?) RETURNING *',
  );
  return stmt.get(token, userId) as unknown as Session;
}

export function findSessionWithUser(token: string): User | undefined {
  return db
    .prepare(
      `SELECT users.* FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token = ?`,
    )
    .get(token) as User | undefined;
}

export function deleteSession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function insertGameResult(
  userId: number,
  score: number,
  result: GameResultOutcome,
): GameResult {
  const stmt = db.prepare(
    'INSERT INTO game_results (user_id, score, result) VALUES (?, ?, ?) RETURNING *',
  );
  return stmt.get(userId, score, result) as unknown as GameResult;
}

export function listGameResultsByUser(userId: number): GameResult[] {
  return db
    .prepare('SELECT * FROM game_results WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId) as GameResult[];
}
