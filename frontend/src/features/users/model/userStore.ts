import type { GameResult } from "../../../games/core/types/GameResult";
import { formatTitle } from "../../../utils/format";
import { getAuthState } from "../../auth/model/authStore";
import type { AuthRole } from "../../auth/model/authTypes";
import type { StoredGameSession, UserRecord, UserStatsRow, UserStoreData } from "./userTypes";

const STORAGE_KEY = "users_store_v1";

const GAME_TITLES: Record<string, string> = {
  "find-circle": "Find Circle",
  "memory-pairs": "Memory Pairs",
  "shape-match": "Shape Match",
  "count-items": "Count Items",
  "find-different": "Find Different",
  "repeat-sequence": "Repeat Sequence",
};

const seedData: UserStoreData = {
  users: [
    {
      id: "admin-1",
      role: "admin",
      login: "admin",
      name: "Main",
      surname: "Admin",
      password: "admin",
      createdAt: "2026-03-15T08:00:00.000Z",
    },
    {
      id: "student-1",
      role: "child",
      login: "emma",
      name: "Emma",
      surname: "Stone",
      createdAt: "2026-03-15T08:05:00.000Z",
    },
    {
      id: "student-2",
      role: "child",
      login: "karel",
      name: "Karel",
      surname: "Novak",
      createdAt: "2026-03-15T08:10:00.000Z",
    },
    {
      id: "student-3",
      role: "child",
      login: "mia",
      name: "Mia",
      surname: "Brown",
      createdAt: "2026-03-15T08:15:00.000Z",
    },
    {
      id: "student-4",
      role: "child",
      login: "alex",
      name: "Alex",
      surname: "Lee",
      createdAt: "2026-03-15T08:20:00.000Z",
    },
  ],
  sessions: [
    {
      id: "session-1",
      userId: "student-1",
      gameKey: "find-circle",
      gameTitle: "Find Circle",
      difficulty: "easy",
      score: 14,
      maxScore: 16,
      success: true,
      playedAt: "2026-03-19T10:20:00.000Z",
    },
    {
      id: "session-2",
      userId: "student-1",
      gameKey: "memory-pairs",
      gameTitle: "Memory Pairs",
      difficulty: "medium",
      score: 11,
      maxScore: 12,
      success: true,
      playedAt: "2026-03-19T11:50:00.000Z",
    },
    {
      id: "session-3",
      userId: "student-2",
      gameKey: "shape-match",
      gameTitle: "Shape Match",
      difficulty: "easy",
      score: 19,
      maxScore: 20,
      success: true,
      playedAt: "2026-03-18T09:15:00.000Z",
    },
    {
      id: "session-4",
      userId: "student-2",
      gameKey: "find-circle",
      gameTitle: "Find Circle",
      difficulty: "hard",
      score: 9,
      maxScore: 16,
      success: true,
      playedAt: "2026-03-18T16:05:00.000Z",
    },
    {
      id: "session-5",
      userId: "student-3",
      gameKey: "count-items",
      gameTitle: "Count Items",
      difficulty: "easy",
      score: 7,
      maxScore: 10,
      success: true,
      playedAt: "2026-03-17T13:40:00.000Z",
    },
  ],
};

function cloneSeedData(): UserStoreData {
  return {
    users: seedData.users.map((user) => ({ ...user })),
    sessions: seedData.sessions.map((session) => ({ ...session })),
  };
}

function persistStore(store: UserStoreData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function parseStore(raw: string | null): UserStoreData | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserStoreData>;
    if (!Array.isArray(parsed.users) || !Array.isArray(parsed.sessions)) {
      return null;
    }

    return {
      users: parsed.users as UserRecord[],
      sessions: parsed.sessions as StoredGameSession[],
    };
  } catch {
    return null;
  }
}

export function ensureUserStore(): UserStoreData {
  const existing = parseStore(window.localStorage.getItem(STORAGE_KEY));
  if (existing) {
    return existing;
  }

  const initial = cloneSeedData();
  persistStore(initial);
  return initial;
}

export function getUserStore(): UserStoreData {
  return ensureUserStore();
}

export function getAllUsers(): UserRecord[] {
  return [...ensureUserStore().users].sort((left, right) => left.login.localeCompare(right.login));
}

export function getUserById(userId: string): UserRecord | null {
  return ensureUserStore().users.find((user) => user.id === userId) ?? null;
}

export function getUserByLogin(login: string, role?: AuthRole): UserRecord | null {
  const normalized = login.trim().toLowerCase();
  return ensureUserStore().users.find((user) => user.login.toLowerCase() === normalized && (!role || user.role === role)) ?? null;
}

export function upsertUserFromApi(input: {
  id: string | number;
  role: AuthRole;
  login: string;
  name: string;
  password?: string;
}): UserRecord {
  const store = ensureUserStore();
  const normalizedId = String(input.id);
  const normalizedLogin = input.login.trim();
  const normalizedName = input.name.trim();

  const nextUser: UserRecord = {
    id: normalizedId,
    role: input.role,
    login: normalizedLogin,
    name: normalizedName,
    surname: "",
    password: input.role === "admin" ? input.password?.trim() : undefined,
    createdAt: new Date().toISOString(),
  };

  const existingUser = store.users.find((user) => user.id === normalizedId);
  const users = existingUser
    ? store.users.map((user) => (user.id === normalizedId ? { ...user, ...nextUser, createdAt: user.createdAt } : user))
    : [...store.users.filter((user) => user.login.toLowerCase() !== normalizedLogin.toLowerCase()), nextUser];

  persistStore({
    users,
    sessions: store.sessions,
  });

  return existingUser
    ? users.find((user) => user.id === normalizedId) ?? nextUser
    : nextUser;
}

export function validateAdminCredentials(login: string, password: string): UserRecord | null {
  const normalizedLogin = login.trim().toLowerCase();
  const normalizedPassword = password.trim();

  return (
    ensureUserStore().users.find(
      (user) => user.role === "admin" && user.login.toLowerCase() === normalizedLogin && user.password === normalizedPassword,
    ) ?? null
  );
}

function splitFullName(fullName: string) {
  const cleaned = fullName.trim().replace(/\s+/g, " ");

  if (!cleaned) {
    return { name: "", surname: "" };
  }

  const parts = cleaned.split(" ");
  if (parts.length === 1) {
    return { name: parts[0], surname: "" };
  }

  return {
    name: parts.slice(0, -1).join(" "),
    surname: parts.slice(-1)[0],
  };
}

export function createUser(input: {
  role: AuthRole;
  login: string;
  fullName: string;
  password?: string;
}): { ok: true; user: UserRecord } | { ok: false; message: string } {
  const store = ensureUserStore();
  const login = input.login.trim().toLowerCase();
  const { name, surname } = splitFullName(input.fullName);
  const password = input.password?.trim();

  if (!login || !name) {
    return { ok: false, message: "Please fill in login and full name." };
  }

  if (!/^[a-z0-9._-]+$/i.test(login)) {
    return { ok: false, message: "Login can contain only letters, numbers, dot, dash or underscore." };
  }

  if (store.users.some((user) => user.login.toLowerCase() === login)) {
    return { ok: false, message: "This login already exists." };
  }

  if (input.role === "admin" && !password) {
    return { ok: false, message: "Admin password is required." };
  }

  const user: UserRecord = {
    id: `${input.role}-${Date.now()}`,
    role: input.role,
    login,
    name,
    surname,
    password: input.role === "admin" ? password : undefined,
    createdAt: new Date().toISOString(),
  };

  const nextStore: UserStoreData = {
    users: [...store.users, user],
    sessions: store.sessions,
  };

  persistStore(nextStore);
  return { ok: true, user };
}


export function deleteUser(userId: string): { ok: true } | { ok: false; message: string } {
  const store = ensureUserStore();
  const target = store.users.find((user) => user.id === userId);

  if (!target) {
    return { ok: false, message: "User was not found." };
  }

  const nextStore: UserStoreData = {
    users: store.users.filter((user) => user.id !== userId),
    sessions: store.sessions.filter((session) => session.userId !== userId),
  };

  persistStore(nextStore);
  return { ok: true };
}

export function getSessionsForUser(userId: string): StoredGameSession[] {
  return [...ensureUserStore().sessions]
    .filter((session) => session.userId === userId)
    .sort((left, right) => new Date(right.playedAt).getTime() - new Date(left.playedAt).getTime());
}

export function recordGameForCurrentUser(result: GameResult) {
  const auth = getAuthState();
  if (!auth?.userId || auth.role !== "child") {
    return;
  }

  const store = ensureUserStore();
  const session: StoredGameSession = {
    id: `session-${Date.now()}`,
    userId: auth.userId,
    gameKey: result.gameKey,
    gameTitle: GAME_TITLES[result.gameKey] ?? formatTitle(result.gameKey),
    difficulty: result.difficulty,
    score: result.score,
    maxScore: result.maxScore,
    success: result.success,
    playedAt: new Date().toISOString(),
    stats: result.stats,
  };

  persistStore({
    users: store.users,
    sessions: [...store.sessions, session],
  });
}

function getBestScoreLabel(userId: string) {
  const sessions = getSessionsForUser(userId);
  if (sessions.length === 0) {
    return "—";
  }

  const bestSession = sessions.reduce((best, current) => {
    const bestRatio = best.maxScore === 0 ? 0 : best.score / best.maxScore;
    const currentRatio = current.maxScore === 0 ? 0 : current.score / current.maxScore;
    return currentRatio > bestRatio ? current : best;
  });

  return `${bestSession.score}/${bestSession.maxScore}`;
}

export function getUserStatsRows(): UserStatsRow[] {
  return getAllUsers().map((user) => {
    const sessions = getSessionsForUser(user.id);
    const lastPlayed = sessions[0]?.playedAt ? formatDateTime(sessions[0].playedAt) : "—";

    return {
      id: user.id,
      role: user.role,
      login: user.login,
      fullName: `${user.name} ${user.surname}`,
      gamesPlayed: sessions.length,
      bestScoreLabel: getBestScoreLabel(user.id),
      lastPlayed,
    };
  });
}

export function getDashboardSummary() {
  const store = ensureUserStore();
  const students = store.users.filter((user) => user.role === "child").length;
  const admins = store.users.filter((user) => user.role === "admin").length;
  const sessions = store.sessions.length;
  const bestSession = store.sessions.reduce<StoredGameSession | null>((best, current) => {
    if (!best) return current;
    const bestRatio = best.maxScore === 0 ? 0 : best.score / best.maxScore;
    const currentRatio = current.maxScore === 0 ? 0 : current.score / current.maxScore;
    return currentRatio > bestRatio ? current : best;
  }, null);

  return {
    totalStudents: students,
    totalAdmins: admins,
    gamesPlayed: sessions,
    bestScore: bestSession ? `${bestSession.score}/${bestSession.maxScore}` : "—",
  };
}

export function formatDateTime(value: string) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
