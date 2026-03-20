export async function simulateDelay<T>(value: T, delay = 200): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), delay);
  });
}
