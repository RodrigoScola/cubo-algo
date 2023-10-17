export function getExponentialBackoff(num: number): number {
  const max = Math.pow(2, num);
  const min = 1;
  const range = max - min;
  const random = Math.random();
  const scaled = Math.pow(random, num);
  const result = Math.floor(min + scaled * range);
  return result;
}
