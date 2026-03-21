import { useTranslation } from "react-i18next";
import { translateGameDescription, translateGameTitle } from "../../../app/i18n/text";
import type { GameCardViewModel } from "../types";

export function useGames() {
  useTranslation();

  const games: GameCardViewModel[] = [
    {
      key: "find-circle",
      name: translateGameTitle("find-circle"),
      description: translateGameDescription("find-circle"),
      implemented: true,
      icon: "strategy",
    },
    {
      key: "track-the-circle",
      name: translateGameTitle("track-the-circle"),
      description: translateGameDescription("track-the-circle"),
      implemented: true,
      icon: "puzzle",
    },
    {
      key: "shape-match",
      name: translateGameTitle("shape-match"),
      description: translateGameDescription("shape-match"),
      implemented: false,
      icon: "arcade",
    },
  ];

  return { games, loading: false };
}
