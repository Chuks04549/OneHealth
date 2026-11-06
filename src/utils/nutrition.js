function dailyValueNumber(nutrient) {
  const value = Number.parseFloat(nutrient?.dailyPct);
  return Number.isFinite(value) ? value : -Infinity;
}

export function sortMicronutrientsByDailyValue(micronutrients = []) {
  return [...micronutrients].sort((first, second) => {
    const percentageDifference = dailyValueNumber(second) - dailyValueNumber(first);
    if (percentageDifference !== 0) return percentageDifference;
    return String(first?.name || '').localeCompare(String(second?.name || ''));
  });
}
