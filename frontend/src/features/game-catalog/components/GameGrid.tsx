import styles from "./GameGrid.module.css";
import { GameCard } from "./GameCard";
import type { GameCardViewModel } from "../types";

export function GameGrid({ games }: { games: GameCardViewModel[] }) {
  return (
    <div className={styles.grid}>
      {games.map((game) => (
        <GameCard key={game.key} game={game} />
      ))}
    </div>
  );
}
