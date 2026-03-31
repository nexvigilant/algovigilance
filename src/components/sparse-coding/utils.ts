/**
 * Format number with appropriate suffix (k, M, G)
 */
export function formatNumber(num: number, decimals = 2): string {
  if (num === 0) return '0';
  if (Math.abs(num) < 1e-15) return num.toExponential(decimals);
  if (Math.abs(num) >= 1e15) return num.toExponential(decimals);
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(decimals) + ' G';
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(decimals) + ' M';
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(decimals) + ' k';
  if (Math.abs(num) < 0.001) return num.toExponential(decimals);
  return num.toFixed(decimals);
}

/**
 * Format number in scientific notation
 */
export function formatScientific(num: number, decimals = 2): string {
  return num.toExponential(decimals);
}
