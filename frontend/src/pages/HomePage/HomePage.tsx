import { Link } from "react-router-dom";
import { PageLayout } from "../../components/layout/PageLayout";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { Button } from "../../components/ui/Button";
import { Loader } from "../../components/ui/Loader";
import { GameGrid } from "../../features/game-catalog/components/GameGrid";
import { useGames } from "../../features/game-catalog/hooks/useGames";

export function HomePage() {
  const { games, loading } = useGames();

  return (
    <PageLayout
      title="Kids Games"
      actions={
        <Link to="/settings">
          <Button variant="secondary">Settings</Button>
        </Link>
      }
    >
      <ScreenContainer>
        {loading ? <Loader /> : <GameGrid games={games} />}
      </ScreenContainer>
    </PageLayout>
  );
}
