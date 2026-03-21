import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { routes } from "../../app/router/routes";
import { getGameByKey, getGameDifficulties } from "../../api/gamesApi";
import type { GameCatalogItem, GameDifficulty } from "../../games/core/types/GameDefinition";
import { useGameSession } from "../../features/game-session/hooks/useGameSession";
import { ArcadeIcon, PuzzleIcon, StrategyIcon } from "../../features/game-catalog/components/GameIcons";
import type { GameMode, GameTimer } from "../../features/game-session/model/sessionTypes";
import styles from "./GameConfigPage.module.css";

type ConfigOption<T extends string> = {
  id: T;
  label: string;
  description: string;
};

const difficultyDescriptions: Record<GameDifficulty, string> = {
  easy: "Large targets and the calmest pace.",
  medium: "A balanced challenge with a few more choices.",
  hard: "More focus and more items on screen.",
};

const modeOptions: ConfigOption<GameMode>[] = [
  {
    id: "guided",
    label: "Guided",
    description: "Extra structure with clearer prompts.",
  },
  {
    id: "free-play",
    label: "Free Play",
    description: "Explore the game with less pressure.",
  },
  {
    id: "single",
    label: "Classic",
    description: "Standard one-player mode.",
  },
];

const timerOptions: ConfigOption<GameTimer>[] = [
  {
    id: "none",
    label: "No Timer",
    description: "Play at your own pace.",
  },
  {
    id: "relaxed",
    label: "Relaxed",
    description: "Gentle time guidance only.",
  },
  {
    id: "short",
    label: "Short",
    description: "A faster session for quick practice.",
  },
];

function getGameIcon(gameKey: string) {
  if (gameKey === "memory-pairs") return <StrategyIcon className={styles.gameIcon} />;
  if (gameKey === "shape-match") return <ArcadeIcon className={styles.gameIcon} />;
  return <PuzzleIcon className={styles.gameIcon} />;
}

function ConfigTile<T extends string>({
  option,
  selected,
  onClick,
}: {
  option: ConfigOption<T>;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.tile} ${selected ? styles.tileSelected : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className={styles.tileLabel}>{option.label}</span>
      <span className={styles.tileDescription}>{option.description}</span>
    </button>
  );
}

export function GameConfigPage() {
  const { gameKey = "" } = useParams();
  const navigate = useNavigate();
  const { saveSessionState } = useGameSession();
  const [game, setGame] = useState<GameCatalogItem | null>(null);
  const [difficulties, setDifficulties] = useState<GameDifficulty[]>(["easy"]);
  const [difficulty, setDifficulty] = useState<GameDifficulty>("easy");
  const [mode, setMode] = useState<GameMode>("guided");
  const [timer, setTimer] = useState<GameTimer>("none");

  useEffect(() => {
    void getGameByKey(gameKey).then(setGame);
    void getGameDifficulties(gameKey).then((items) => {
      setDifficulties(items);
      setDifficulty(items[0] ?? "easy");
    });
  }, [gameKey]);

  const difficultyOptions = useMemo<ConfigOption<GameDifficulty>[]>(() => {
    return difficulties.map((item) => ({
      id: item,
      label: item.charAt(0).toUpperCase() + item.slice(1),
      description: difficultyDescriptions[item],
    }));
  }, [difficulties]);

  function handleStart() {
    saveSessionState({ gameKey, difficulty, mode, timer });
    navigate(`/play/${gameKey}?difficulty=${difficulty}&mode=${mode}&timer=${timer}`);
  }

  function handleBack() {
    navigate(routes.games);
  }

  return (
    <main className={styles.page}>
      <button type="button" onClick={handleBack} className={styles.backButton}>
        <svg className={styles.backArrow} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Back</span>
      </button>

      <div className={styles.header}>
        <div className={styles.iconBox}>{getGameIcon(gameKey)}</div>
        <h1 className={styles.title}>{game?.name ?? "Game"}</h1>
        <p className={styles.subtitle}>Choose calm settings before you start playing.</p>
      </div>

      <div className={styles.panel}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Difficulty</h2>
          <div className={styles.grid}>
            {difficultyOptions.map((option) => (
              <ConfigTile
                key={option.id}
                option={option}
                selected={difficulty === option.id}
                onClick={() => setDifficulty(option.id)}
              />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Mode</h2>
          <div className={styles.grid}>
            {modeOptions.map((option) => (
              <ConfigTile key={option.id} option={option} selected={mode === option.id} onClick={() => setMode(option.id)} />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Timer</h2>
          <div className={styles.grid}>
            {timerOptions.map((option) => (
              <ConfigTile key={option.id} option={option} selected={timer === option.id} onClick={() => setTimer(option.id)} />
            ))}
          </div>
        </section>
      </div>

      <button type="button" onClick={handleStart} className={styles.startButton}>
        Start Game
      </button>
    </main>
  );
}
