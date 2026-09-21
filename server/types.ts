export interface User {
  id: number;
  username: string;
  password_hash: string;
  password_salt: string;
  created_at: string;
}

export interface PublicUser {
  id: number;
  username: string;
}

export interface Session {
  token: string;
  user_id: number;
  created_at: string;
}

export type GameResultOutcome = 'win' | 'lose' | 'tie';

export interface GameResult {
  id: number;
  user_id: number;
  score: number;
  result: GameResultOutcome;
  created_at: string;
}
