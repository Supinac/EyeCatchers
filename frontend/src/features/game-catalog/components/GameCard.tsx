import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./GameCard.module.css";
import type { GameCardViewModel } from "../types";
import { ArcadeIcon, PuzzleIcon, StrategyIcon } from "./GameIcons";

function getIcon(icon: GameCardViewModel["icon"]) {
  if (icon === "strategy") return <StrategyIcon />;
  if (icon === "arcade") return <ArcadeIcon />;
  return <PuzzleIcon />;
}

export function GameCard({ game }: { game: GameCardViewModel }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isLocked = !game.implemented;

  return (
    <button
      type="button"
      className={`${styles.card} ${isLocked ? styles.cardLocked : ""}`}
      onClick={isLocked ? undefined : () => navigate(`/game/${game.key}`)}
      aria-label={`${game.name}. ${game.implemented ? t("games.readyToOpen") : ""}`}
      disabled={isLocked}
    >
      <div className={styles.iconBox}>{getIcon(game.icon)}</div>

      <div className={styles.content}>
        <h2 className={styles.title}>{game.name}</h2>
        <p className={styles.description}>{game.description}</p>
      </div>

      <div className={styles.playWrap}>
        <span className={styles.playText}>{game.implemented ? t("games.play") : t("games.locked")}</span>
        <svg className={styles.playArrow} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M6 12L10 8L6 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {isLocked ? <div className={styles.lockOverlay}></div> : null}
    </button>
  );
}
