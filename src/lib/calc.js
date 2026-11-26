// Core maths for GenShift. Kept pure so it can be unit tested.
// Petrol CO2 factor: about 2.31 kg CO2 per litre burned (IPCC / US EIA).
export const CO2_PER_LITRE = 2.31;
export const DEFAULT_FUEL_PRICE = 1100; // naira per litre, editable in the app
export const DEFAULT_TARIFF = 210; // naira per kWh grid band estimate, editable

export function fuelCost(litres, price = DEFAULT_FUEL_PRICE) {
  if (!isFinite(litres) || litres < 0) return 0;
  return litres * price;
}

export function co2FromFuel(litres) {
  if (!isFinite(litres) || litres < 0) return 0;
  return litres * CO2_PER_LITRE;
}

export function applianceKwh(watts, hoursPerDay, qty = 1) {
  if (watts < 0 || hoursPerDay < 0 || qty < 0) return 0;
  return (watts * hoursPerDay * qty) / 1000;
}

export function monthlyCost(kwhPerDay, rate) {
  return kwhPerDay * 30 * rate;
}

// If a home cuts generator use by cutHours per day, how much fuel is saved?
// Assumes the generator burns litresPerHour (small petrol gens: 0.6 to 1.2).
export function shiftSavings({ cutHoursPerDay, litresPerHour, fuelPrice = DEFAULT_FUEL_PRICE }) {
  const litresSavedPerMonth = Math.max(0, cutHoursPerDay) * Math.max(0, litresPerHour) * 30;
  return {
    litresSavedPerMonth,
    nairaSavedPerMonth: litresSavedPerMonth * fuelPrice,
    co2SavedPerMonth: co2FromFuel(litresSavedPerMonth),
  };
}

export function paybackMonths(systemCost, monthlySaving) {
  if (monthlySaving <= 0) return Infinity;
  return systemCost / monthlySaving;
}

export function summariseLogs(logs, fuelPrice = DEFAULT_FUEL_PRICE) {
  const totalFuel = logs.reduce((s, l) => s + (Number(l.fuelLitres) || 0), 0);
  const totalGenHours = logs.reduce((s, l) => s + (Number(l.genHours) || 0), 0);
  const totalNepaHours = logs.reduce((s, l) => s + (Number(l.nepaHours) || 0), 0);
  return {
    days: logs.length,
    totalFuel,
    totalGenHours,
    totalNepaHours,
    fuelCost: fuelCost(totalFuel, fuelPrice),
    co2Kg: co2FromFuel(totalFuel),
    avgFuelPerDay: logs.length ? totalFuel / logs.length : 0,
    avgGenHoursPerDay: logs.length ? totalGenHours / logs.length : 0,
  };
}

export function formatNaira(n) {
  return "NGN " + Math.round(n).toLocaleString("en-NG");
}

export function treesEquivalent(co2Kg) {
  // One mature tree absorbs roughly 21 kg CO2 per year.
  return co2Kg / 21;
}
