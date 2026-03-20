import { PageLayout } from "../../components/layout/PageLayout";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { Loader } from "../../components/ui/Loader";
import { GameGrid } from "../../features/game-catalog/components/GameGrid";
import { useGames } from "../../features/game-catalog/hooks/useGames";

export function HomePage() {
  const { games, loading } = useGames();

  return (
    <PageLayout title="Kids Games" actions={<ButtonLink to="/settings" variant="secondary">Settings</ButtonLink>}>
      <ScreenContainer>{loading ? <Loader /> : <GameGrid games={games} />}</ScreenContainer>
    </PageLayout>
  );
}
