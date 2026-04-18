export const PRICING_DEFAULTS = {
  filamentPricePerGram: 0.08,
  machineConsumptionKw: 0.1,
  energyPricePerKwh: 1.1,
  wearCostPerHour: 0.9,
  failureRate: 0.08,
  technicalHourRate: 18,
  retailMarkup: 2.6,
  wholesaleMarkup: 2.0,
  retailLaborHours: 0.2,
  wholesaleLaborHours: 0.06,
};

export type PricingInput = {
  weightGrams: number;
  printHours: number;
};

export type PricingSuggestion = {
  materialCost: number;
  energyCost: number;
  depreciationCost: number;
  failureCost: number;
  productionCost: number;
  retailPrice: number;
  wholesalePrice: number;
};

const money = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0);
const roundCurrency = (value: number) => Math.round(money(value) * 100) / 100;

export function calculatePricingSuggestion(input: PricingInput): PricingSuggestion {
  const weightGrams = money(input.weightGrams);
  const printHours = money(input.printHours);

  const materialCost = weightGrams * PRICING_DEFAULTS.filamentPricePerGram;
  const energyCost = printHours * PRICING_DEFAULTS.machineConsumptionKw * PRICING_DEFAULTS.energyPricePerKwh;
  const depreciationCost = printHours * PRICING_DEFAULTS.wearCostPerHour;
  const failureCost = (materialCost + energyCost + depreciationCost) * PRICING_DEFAULTS.failureRate;
  const productionCost = materialCost + energyCost + depreciationCost + failureCost;

  const retailLabor = PRICING_DEFAULTS.technicalHourRate * PRICING_DEFAULTS.retailLaborHours;
  const wholesaleLabor = PRICING_DEFAULTS.technicalHourRate * PRICING_DEFAULTS.wholesaleLaborHours;

  return {
    materialCost: roundCurrency(materialCost),
    energyCost: roundCurrency(energyCost),
    depreciationCost: roundCurrency(depreciationCost),
    failureCost: roundCurrency(failureCost),
    productionCost: roundCurrency(productionCost),
    retailPrice: roundCurrency((productionCost + retailLabor) * PRICING_DEFAULTS.retailMarkup),
    wholesalePrice: roundCurrency((productionCost + wholesaleLabor) * PRICING_DEFAULTS.wholesaleMarkup),
  };
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}
