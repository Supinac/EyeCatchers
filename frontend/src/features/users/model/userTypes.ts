import type { AuthRole } from "../../auth/model/authTypes";
import type { GameDifficulty } from "../../../games/core/types/GameDefinition";

export type UserRecord = {
  id: string;
  role: AuthRole;
  login: string;
  name: string;
  surname: string;
  password?: string;
  createdAt: string;
};

export type StoredGameSession = {
  id: string;
  userId: string;
  gameKey: string;
  gameTitle: string;
  difficulty: GameDifficulty;
  score: number;
  maxScore: number;
  success: boolean;
  playedAt: string;
};

export type UserStatsRow = {
  id: string;
  role: AuthRole;
  login: string;
  fullName: string;
  gamesPlayed: number;
  bestScoreLabel: string;
  lastPlayed: string;
};

export type UserStoreData = {
  users: UserRecord[];
  sessions: StoredGameSession[];
};
