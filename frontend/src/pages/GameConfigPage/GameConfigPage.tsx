import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getGameByKey, getGameDifficulties } from "../../api/gamesApi";
import { PageLayout } from "../../components/layout/PageLayout";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DifficultySelector } from "../../components/ui/DifficultySelector";
import type { GameCatalogItem, GameDifficulty } from "../../games/core/types/GameDefinition";
import { useGameSession } from "../../features/game-session/hooks/useGameSession";

export function GameConfigPage() {
  const { gameKey = "" } = useParams();
  const navigate = useNavigate();
  const { saveSessionState } = useGameSession();
  const [game, setGame] = useState<GameCatalogItem | null>(null);
  const [difficulties, setDifficulties] = useState<GameDifficulty[]>(["easy"]);
  const [difficulty, setDifficulty] = useState<GameDifficulty>("easy");

  useEffect(() => {
    getGameByKey(gameKey).then(setGame);
    getGameDifficulties(gameKey).then((items) => {
      setDifficulties(items);
      setDifficulty(items[0] ?? "easy");
    });
  }, [gameKey]);

  const subtitle = useMemo(() => {
    if (!game) return "Loading...";
    return game.implemented ? "Ready to play" : "This is placeholder flow for now";
  }, [game]);

  function handleStart() {
    saveSessionState({ gameKey, difficulty });
    navigate(`/play/${gameKey}?difficulty=${difficulty}`);
  }

  return (
    <PageLayout
      title={game?.name ?? "Game"}
      actions={
        <Link to="/">
          <Button variant="ghost">Back</Button>
        </Link>
      }
    >
      <ScreenContainer>
        <Card>
          <p>{subtitle}</p>
          <p>Select difficulty:</p>
          <DifficultySelector options={difficulties} value={difficulty} onChange={setDifficulty} />
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <Button onClick={handleStart}>Start</Button>
          </div>
        </Card>
      </ScreenContainer>
    </PageLayout>
  );
}
