import { useLocation } from "react-router-dom";
import { PageLayout } from "../../components/layout/PageLayout";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { Card } from "../../components/ui/Card";
import type { GameResult } from "../../games/core/types/GameResult";

export function ResultPage() {
  const location = useLocation();
  const result = (location.state as GameResult | undefined) ?? null;

  return (
    <PageLayout title="Result">
      <ScreenContainer>
        <Card>
          <h2 style={{ marginTop: 0 }}>{result?.success ? "Finished" : "Try again"}</h2>
          <p>Game: {result?.gameKey ?? "Unknown"}</p>
          <p>Difficulty: {result?.difficulty ?? "easy"}</p>
          <p>
            Score: {result?.score ?? 0} / {result?.maxScore ?? 1}
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
            <ButtonLink to="/">Home</ButtonLink>
            {result?.gameKey ? <ButtonLink to={`/game/${result.gameKey}`} variant="secondary">Play Again</ButtonLink> : null}
          </div>
        </Card>
      </ScreenContainer>
    </PageLayout>
  );
}
