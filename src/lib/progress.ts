export function calculateProgressScore(uom: string, trackingType: string, targetStr: string, actualStr: string): number {
  if (!actualStr) return 0;

  try {
    if (uom === 'NUMERIC' || uom === 'PERCENTAGE') {
      const target = parseFloat(targetStr);
      const actual = parseFloat(actualStr);
      if (isNaN(target) || isNaN(actual)) return 0;

      if (trackingType === 'MAX') {
        // Lower is better (e.g. error rate 2 vs target 5 = 5/2 = 250% -> cap at 100% or just return 100%)
        // Actually: Target / Achievement. If achievement is 0, score is 100%.
        if (actual === 0) return 100;
        const score = (target / actual) * 100;
        return Math.min(Math.round(score), 100);
      } else {
        // Higher is better (e.g. MIN): Achievement / Target
        if (target === 0) return actual >= 0 ? 100 : 0;
        const score = (actual / target) * 100;
        return Math.min(Math.round(score), 100);
      }
    } else if (uom === 'TIMELINE') {
      // Date comparison: if actual date <= target date -> 100%, else 0%
      const targetDate = new Date(targetStr).getTime();
      const actualDate = new Date(actualStr).getTime();
      if (isNaN(targetDate) || isNaN(actualDate)) return 0;
      return actualDate <= targetDate ? 100 : 0;
    } else if (uom === 'ZERO_BASED') {
      // 0 = 100%, else 0%
      const actual = parseFloat(actualStr);
      return actual === 0 ? 100 : 0;
    }
  } catch (e) {
    return 0;
  }
  return 0;
}
