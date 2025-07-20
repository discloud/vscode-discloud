export function clamp(value: number, lowerLimit: number, upperLimit: number) {
  return Math.min(Math.max(value, lowerLimit), upperLimit);
}
