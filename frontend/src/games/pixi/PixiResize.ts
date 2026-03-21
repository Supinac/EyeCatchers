export function getGameSize(container: HTMLDivElement) {
  return {
    width: Math.max(container.clientWidth, 320),
    height: Math.max(container.clientHeight, 540),
  };
}
