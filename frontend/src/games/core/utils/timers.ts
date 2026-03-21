export function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}
