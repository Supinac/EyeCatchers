import type { GameDifficulty } from "../../games/core/types/GameDefinition";
import styles from "./DifficultySelector.module.css";

export function DifficultySelector({
  options,
  value,
  onChange,
}: {
  options: GameDifficulty[];
  value: GameDifficulty;
  onChange: (next: GameDifficulty) => void;
}) {
  return (
    <div className={styles.wrap}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`${styles.item} ${value === option ? styles.active : ""}`.trim()}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
