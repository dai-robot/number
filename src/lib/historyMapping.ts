export function mapSecondsToYear(stoppedSeconds: number): number {
  const year = Math.round(stoppedSeconds * 100);
  return Math.max(1, Math.min(2026, year));
}
