export type GameIconKey = "puzzle" | "strategy" | "arcade";

export type GameCardViewModel = {
  key: string;
  name: string;
  description: string;
  implemented: boolean;
  icon: GameIconKey;
};
