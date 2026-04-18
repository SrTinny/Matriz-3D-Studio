export const PRICING_DEFAULTS = {
  filamentPricePerGram: 0.08,
  machineConsumptionKw: 0.1,
  energyPricePerKwh: 1.1,
  wearCostPerHour: 1,
  technicalHourRate: 20,
  retailMarkup: 2.8,
  wholesaleMarkup: 2.1,
  retailLaborHours: 0.25,
  wholesaleLaborHours: 0.08,
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
  const failureCost = (materialCost + energyCost + depreciationCost) * 0.1;
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
