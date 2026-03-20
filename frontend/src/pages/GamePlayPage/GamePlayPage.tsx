import { useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { saveSessionResult } from "../../api/sessionsApi";
import { PageLayout } from "../../components/layout/PageLayout";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { PixiGameHost } from "../../games/pixi/PixiGameHost";
import type { GameDifficulty } from "../../games/core/types/GameDefinition";
import type { GameResult } from "../../games/core/types/GameResult";

export function GamePlayPage() {
  const { gameKey = "find-circle" } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const difficulty = (searchParams.get("difficulty") as GameDifficulty) || "easy";

  const handleComplete = useCallback(
    async (result: GameResult) => {
      await saveSessionResult(result);
      navigate("/result", { state: result });
    },
    [navigate],
  );

  return (
    <PageLayout title="Play" actions={<ButtonLink to={`/game/${gameKey}`} variant="ghost">Back</ButtonLink>}>
      <ScreenContainer>
        <PixiGameHost gameKey={gameKey} difficulty={difficulty} onComplete={handleComplete} />
      </ScreenContainer>
    </PageLayout>
  );
}
