import type { GameCardViewModel } from "../types";

const games: GameCardViewModel[] = [
  {
    key: "find-circle",
    name: "Find Circle",
    description: "Tap the circle. A calm first game to test the flow and start playing.",
    implemented: true,
    icon: "puzzle",
  },
  {
    key: "memory-pairs",
    name: "Memory Pairs",
    description: "Match simple pairs with a slow, predictable rhythm and minimal distractions.",
    implemented: false,
    icon: "strategy",
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
