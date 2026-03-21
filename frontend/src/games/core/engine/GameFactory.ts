import { getRegisteredGame } from "./GameRegistry";

export function createGame(gameKey: string) {
  return getRegisteredGame(gameKey);
}
