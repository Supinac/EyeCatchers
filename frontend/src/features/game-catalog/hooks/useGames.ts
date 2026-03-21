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
    key: "shape-match",
    name: "Shape Match",
    description: "Choose the correct shape with large clear targets and a very simple layout.",
    implemented: false,
    icon: "arcade",
  },
];

export function useGames() {
  return { games, loading: false };
}
