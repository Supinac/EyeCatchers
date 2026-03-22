import type { GameCardViewModel } from "../types";

const games: GameCardViewModel[] = [
  {
    key: "find-circle",
    name: "Memory Game",
    description: "Memorize icon and then try to find it. A calm first game to test the flow.",
    implemented: true,
    icon: "strategy",
  },
  {
    key: "track-the-circle",
    name: "Track the Circle",
    description: "Follow the moving circle as it changes direction and speed.",
    implemented: true,
    icon: "puzzle",
  },
  {
    key: "keys",
    name: "Klíče",
    description: "Najdi správný klíč podle počtu zubů a prostorové orientace.",
    implemented: true,
    icon: "puzzle",
  }
];

export function useGames() {
  return { games, loading: false };
}