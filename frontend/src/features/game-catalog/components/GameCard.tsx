import { useNavigate } from "react-router-dom";
import { Card } from "../../../components/ui/Card";
import styles from "./GameCard.module.css";
import type { GameCardViewModel } from "../types";

export function GameCard({ game }: { game: GameCardViewModel }) {
  const navigate = useNavigate();

  return (
    <button type="button" className={styles.link} onClick={() => navigate(`/game/${game.key}`)}>
      <Card>
        <div className={styles.card}>
          <div className={styles.icon}>◻</div>
          <div className={styles.title}>{game.name}</div>
          <div className={styles.status}>{game.implemented ? "Ready to test" : "Placeholder"}</div>
        </div>
      </Card>
    </button>
  );
}
