const PRICING_DEFAULTS = {
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

const INPUT_DEFAULTS = {
  weight: 120,
  hours: 4,
  filamentCost: PRICING_DEFAULTS.filamentPricePerGram,
  extraCosts: 0,
  extraCostsMultiplier: 1,
  totalPieces: 1,
};

const STORAGE_KEY = 'calculadora_precificacao_v1';
const FIELD_RULES = {
  weight: { min: 0, max: 50000, decimals: 2 },
  hours: { min: 0, max: 1000, decimals: 2 },
  filamentCost: { min: 0, max: 10, decimals: 3 },
  extraCosts: { min: 0, max: 1000, decimals: 2 },
  extraCostsMultiplier: { min: 1, max: 200, decimals: 0 },
  totalPieces: { min: 1, max: 100000, decimals: 0 },
};

const money = (value) => Math.max(0, Number.isFinite(value) ? value : 0);
const roundCurrency = (value) => Math.round(money(value) * 100) / 100;
const formatBRL = (value) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(value || 0);

function calculatePricingSuggestion(input) {
  const weightGrams = money(input.weightGrams);
  const printHours = money(input.printHours);
  const filamentPricePerGram = money(input.filamentPricePerGram);
  const additionalCostsPerPiece = money(input.additionalCostsPerPiece);
  const trayPieceQuantity = Math.max(1, Math.floor(money(input.trayPieceQuantity)));
  const totalPieceQuantity = Math.max(1, Math.floor(money(input.totalPieceQuantity)));
  const traysNeeded = Math.max(1, Math.ceil(totalPieceQuantity / trayPieceQuantity));
  const additionalCosts = additionalCostsPerPiece * trayPieceQuantity;

  const materialCost = weightGrams * filamentPricePerGram;
  const energyCost = printHours * PRICING_DEFAULTS.machineConsumptionKw * PRICING_DEFAULTS.energyPricePerKwh;
  const depreciationCost = printHours * PRICING_DEFAULTS.wearCostPerHour;
  const failureCost = (materialCost + energyCost + depreciationCost) * PRICING_DEFAULTS.failureRate;
  const productionCost = materialCost + energyCost + depreciationCost + failureCost + additionalCosts;

  const retailLabor = PRICING_DEFAULTS.technicalHourRate * PRICING_DEFAULTS.retailLaborHours;
  const wholesaleLabor = PRICING_DEFAULTS.technicalHourRate * PRICING_DEFAULTS.wholesaleLaborHours;
  const retailPrice = (productionCost + retailLabor) * PRICING_DEFAULTS.retailMarkup;
  const wholesalePrice = (productionCost + wholesaleLabor) * PRICING_DEFAULTS.wholesaleMarkup;

  return {
    materialCost: roundCurrency(materialCost),
    energyCost: roundCurrency(energyCost),
    depreciationCost: roundCurrency(depreciationCost),
    failureCost: roundCurrency(failureCost),
    additionalCosts: roundCurrency(additionalCosts),
    productionCost: roundCurrency(productionCost),
    productionUnitCost: roundCurrency(productionCost / trayPieceQuantity),
    productionFinalCost: roundCurrency(productionCost * traysNeeded),
    traysNeeded,
    retailPrice: roundCurrency(retailPrice),
    retailUnitPrice: roundCurrency(retailPrice / trayPieceQuantity),
    retailFinalPrice: roundCurrency(retailPrice * traysNeeded),
    wholesalePrice: roundCurrency(wholesalePrice),
    wholesaleUnitPrice: roundCurrency(wholesalePrice / trayPieceQuantity),
    wholesaleFinalPrice: roundCurrency(wholesalePrice * traysNeeded),
  };
}

function initCalculator() {
  const refs = {
    weight: document.getElementById('weight'),
    hours: document.getElementById('hours'),
    filamentCost: document.getElementById('filamentCost'),
    extraCosts: document.getElementById('extraCosts'),
    extraCostsMultiplier: document.getElementById('extraCostsMultiplier'),
    totalPieces: document.getElementById('totalPieces'),
    materialCost: document.getElementById('materialCost'),
    energyCost: document.getElementById('energyCost'),
    depreciationCost: document.getElementById('depreciationCost'),
    failureCost: document.getElementById('failureCost'),
    additionalCosts: document.getElementById('additionalCosts'),
    productionCost: document.getElementById('productionCost'),
    productionUnitCost: document.getElementById('productionUnitCost'),
    traysNeeded: document.getElementById('traysNeeded'),
    productionFinalCost: document.getElementById('productionFinalCost'),
    retailPrice: document.getElementById('retailPrice'),
    retailUnitPrice: document.getElementById('retailUnitPrice'),
    retailFinalPrice: document.getElementById('retailFinalPrice'),
    wholesalePrice: document.getElementById('wholesalePrice'),
    wholesaleUnitPrice: document.getElementById('wholesaleUnitPrice'),
    wholesaleFinalPrice: document.getElementById('wholesaleFinalPrice'),
    resetDefaults: document.getElementById('resetDefaults'),
    clearFields: document.getElementById('clearFields'),
    copySummary: document.getElementById('copySummary'),
    actionFeedback: document.getElementById('actionFeedback'),
  };

  let lastSuggestion = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeNumber(rawValue, rule) {
    let s = String(rawValue || '').trim();
    s = s.replace(/,/g, '.');
    s = s.replace(/[^0-9.\-]/g, '');
    const parsed = Number(s);
    const finite = Number.isFinite(parsed) ? parsed : rule.min;
    const clamped = clamp(finite, rule.min, rule.max);

    if (rule.decimals === 0) {
      return Math.floor(clamped);
    }

    const factor = 10 ** rule.decimals;
    return Math.round(clamped * factor) / factor;
  }

  function sanitizeInput(ref, rule, formatOnField = false) {
    const normalized = normalizeNumber(ref.value, rule);
    if (formatOnField && rule.decimals > 0) {
      ref.value = normalized.toFixed(rule.decimals).replace('.', ',');
    } else {
      ref.value = String(normalized);
    }
    return normalized;
  }

  function setFeedback(message) {
    refs.actionFeedback.textContent = message;
  }

  function readInputs() {
    return {
      weight: normalizeNumber(refs.weight.value, FIELD_RULES.weight),
      hours: normalizeNumber(refs.hours.value, FIELD_RULES.hours),
      filamentCost: normalizeNumber(refs.filamentCost.value, FIELD_RULES.filamentCost),
      extraCosts: normalizeNumber(refs.extraCosts.value, FIELD_RULES.extraCosts),
      extraCostsMultiplier: normalizeNumber(refs.extraCostsMultiplier.value, FIELD_RULES.extraCostsMultiplier),
      totalPieces: normalizeNumber(refs.totalPieces.value, FIELD_RULES.totalPieces),
    };
  }

  function setInputs(values) {
    refs.weight.value = String(values.weight);
    refs.hours.value = String(values.hours);
    refs.filamentCost.value = String(values.filamentCost);
    refs.extraCosts.value = String(values.extraCosts);
    refs.extraCostsMultiplier.value = String(values.extraCostsMultiplier);
    refs.totalPieces.value = String(values.totalPieces);
  }

  function saveInputs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readInputs()));
    } catch {
      // ignore storage failures in file:// contexts
    }
  }

  function loadInputs() {
    let raw = null;

    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }

    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      setInputs({
        weight: Number.isFinite(parsed.weight) ? parsed.weight : INPUT_DEFAULTS.weight,
        hours: Number.isFinite(parsed.hours) ? parsed.hours : INPUT_DEFAULTS.hours,
        filamentCost: Number.isFinite(parsed.filamentCost) ? parsed.filamentCost : INPUT_DEFAULTS.filamentCost,
        extraCosts: Number.isFinite(parsed.extraCosts) ? parsed.extraCosts : INPUT_DEFAULTS.extraCosts,
        extraCostsMultiplier: Number.isFinite(parsed.extraCostsMultiplier) ? parsed.extraCostsMultiplier : INPUT_DEFAULTS.extraCostsMultiplier,
        totalPieces: Number.isFinite(parsed.totalPieces) ? parsed.totalPieces : INPUT_DEFAULTS.totalPieces,
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function update() {
    const inputs = readInputs();
    const suggestion = calculatePricingSuggestion({
      weightGrams: inputs.weight,
      printHours: inputs.hours,
      filamentPricePerGram: inputs.filamentCost,
      additionalCostsPerPiece: inputs.extraCosts,
      trayPieceQuantity: inputs.extraCostsMultiplier,
      totalPieceQuantity: inputs.totalPieces,
    });

    lastSuggestion = suggestion;

    refs.materialCost.textContent = formatBRL(suggestion.materialCost);
    refs.energyCost.textContent = formatBRL(suggestion.energyCost);
    refs.depreciationCost.textContent = formatBRL(suggestion.depreciationCost);
    refs.failureCost.textContent = formatBRL(suggestion.failureCost);
    refs.additionalCosts.textContent = formatBRL(suggestion.additionalCosts);
    refs.productionCost.textContent = formatBRL(suggestion.productionCost);
    refs.productionUnitCost.textContent = formatBRL(suggestion.productionUnitCost);
    refs.traysNeeded.textContent = String(suggestion.traysNeeded);
    refs.productionFinalCost.textContent = formatBRL(suggestion.productionFinalCost);
    refs.retailPrice.textContent = formatBRL(suggestion.retailPrice);
    refs.retailUnitPrice.textContent = formatBRL(suggestion.retailUnitPrice);
    refs.retailFinalPrice.textContent = formatBRL(suggestion.retailFinalPrice);
    refs.wholesalePrice.textContent = formatBRL(suggestion.wholesalePrice);
    refs.wholesaleUnitPrice.textContent = formatBRL(suggestion.wholesaleUnitPrice);
    refs.wholesaleFinalPrice.textContent = formatBRL(suggestion.wholesaleFinalPrice);

    saveInputs();
  }

  function buildSummaryText(suggestion) {
    const inputValues = readInputs();
    return [
      'Resumo de precificacao 3D',
      `Peso: ${inputValues.weight} g`,
      `Horas de impressao: ${inputValues.hours} h`,
      `Custo filamento: ${formatBRL(inputValues.filamentCost)} por g`,
      `Outros custos por peca: ${formatBRL(inputValues.extraCosts)}`,
      `Quantidade de pecas por bandeja: ${inputValues.extraCostsMultiplier}`,
      `Quantidade total de pecas do pedido: ${inputValues.totalPieces}`,
      '',
      `Custo total de producao: ${formatBRL(suggestion.productionCost)}`,
      `Custo de producao por peca: ${formatBRL(suggestion.productionUnitCost)}`,
      `Bandejas necessarias: ${suggestion.traysNeeded}`,
      `Orcamento final de producao: ${formatBRL(suggestion.productionFinalCost)}`,
      `Preco varejo total: ${formatBRL(suggestion.retailPrice)}`,
      `Preco varejo por peca: ${formatBRL(suggestion.retailUnitPrice)}`,
      `Orcamento final varejo: ${formatBRL(suggestion.retailFinalPrice)}`,
      `Preco atacado total: ${formatBRL(suggestion.wholesalePrice)}`,
      `Preco atacado por peca: ${formatBRL(suggestion.wholesaleUnitPrice)}`,
      `Orcamento final atacado: ${formatBRL(suggestion.wholesaleFinalPrice)}`,
    ].join('\n');
  }

  async function copySummaryToClipboard() {
    if (!lastSuggestion) update();

    const summary = buildSummaryText(lastSuggestion);

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(summary);
      } else {
        const fallback = document.createElement('textarea');
        fallback.value = summary;
        fallback.style.position = 'fixed';
        fallback.style.left = '-9999px';
        document.body.appendChild(fallback);
        fallback.focus();
        fallback.select();
        document.execCommand('copy');
        document.body.removeChild(fallback);
      }

      setFeedback('Resumo copiado com sucesso.');
    } catch {
      setFeedback('Nao foi possivel copiar automaticamente. Tente novamente.');
    }
  }

  refs.weight.addEventListener('input', update);
  refs.hours.addEventListener('input', update);
  refs.filamentCost.addEventListener('input', update);
  refs.extraCosts.addEventListener('input', update);
  refs.extraCostsMultiplier.addEventListener('input', update);
  refs.totalPieces.addEventListener('input', update);

  refs.weight.addEventListener('blur', () => {
    sanitizeInput(refs.weight, FIELD_RULES.weight, true);
    update();
  });
  refs.hours.addEventListener('blur', () => {
    sanitizeInput(refs.hours, FIELD_RULES.hours, true);
    update();
  });
  refs.filamentCost.addEventListener('blur', () => {
    sanitizeInput(refs.filamentCost, FIELD_RULES.filamentCost, true);
    update();
  });
  refs.extraCosts.addEventListener('blur', () => {
    sanitizeInput(refs.extraCosts, FIELD_RULES.extraCosts, true);
    update();
  });
  refs.extraCostsMultiplier.addEventListener('blur', () => {
    sanitizeInput(refs.extraCostsMultiplier, FIELD_RULES.extraCostsMultiplier, false);
    update();
  });
  refs.totalPieces.addEventListener('blur', () => {
    sanitizeInput(refs.totalPieces, FIELD_RULES.totalPieces, false);
    update();
  });

  refs.resetDefaults.addEventListener('click', () => {
    setInputs(INPUT_DEFAULTS);
    setFeedback('Valores padrao restaurados.');
    update();
  });

  refs.clearFields.addEventListener('click', () => {
    setInputs({
      ...INPUT_DEFAULTS,
      weight: 0,
      hours: 0,
      filamentCost: 0,
    });
    setFeedback('Campos principais limpos.');
    update();
  });

  refs.copySummary.addEventListener('click', copySummaryToClipboard);

  loadInputs();
  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalculator);
} else {
  initCalculator();
}
