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
    key: "memory-pairs",
    name: "Memory Pairs",
    description: "Match simple pairs with a slow, predictable rhythm and minimal distractions.",
    implemented: false,
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
