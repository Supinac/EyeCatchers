import { useEffect, useState } from "react";
import { getGames } from "../../../api/gamesApi";
import type { GameCatalogItem } from "../../../games/core/types/GameDefinition";

export function useGames() {
  const [games, setGames] = useState<GameCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGames()
      .then(setGames)
      .finally(() => setLoading(false));
  }, []);

  return { games, loading };
}
