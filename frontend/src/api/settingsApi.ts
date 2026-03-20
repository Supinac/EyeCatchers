import { simulateDelay } from "./client";

export type AppSettings = {
  soundEnabled: boolean;
  animationLevel: "none" | "minimal";
};

let currentSettings: AppSettings = {
  soundEnabled: false,
  animationLevel: "none",
};

export async function getSettings(): Promise<AppSettings> {
  return simulateDelay(currentSettings, 150);
}

export async function updateSettings(next: AppSettings): Promise<AppSettings> {
  currentSettings = next;
  return simulateDelay(currentSettings, 150);
}
