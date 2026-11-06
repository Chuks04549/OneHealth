const MEAL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'isFood', 'label', 'category', 'confidence', 'portion', 'calories',
    'macros', 'items', 'micros', 'alternatives', 'assumptions', 'warning',
  ],
  properties: {
    isFood: { type: 'boolean' },
    label: { type: 'string' },
    category: {
      type: 'string',
      enum: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'drink', 'mixed meal', 'unknown'],
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    portion: {
      type: 'object',
      additionalProperties: false,
      required: ['amount', 'unit', 'baseGrams', 'grams'],
      properties: {
        amount: { type: 'number', minimum: 0 },
        unit: { type: 'string' },
        baseGrams: { type: 'number', minimum: 0 },
        grams: { type: 'number', minimum: 0 },
      },
    },
    calories: { type: 'number', minimum: 0 },
    macros: {
      type: 'object',
      additionalProperties: false,
      required: ['protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g'],
      properties: {
        protein_g: { type: 'number', minimum: 0 },
        carbs_g: { type: 'number', minimum: 0 },
        fat_g: { type: 'number', minimum: 0 },
        fiber_g: { type: 'number', minimum: 0 },
        sugar_g: { type: 'number', minimum: 0 },
      },
    },
    items: {
      type: 'array',
      maxItems: 12,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'estimatedGrams', 'calories', 'protein_g', 'carbs_g', 'fat_g'],
        properties: {
          name: { type: 'string' },
          estimatedGrams: { type: 'number', minimum: 0 },
          calories: { type: 'number', minimum: 0 },
          protein_g: { type: 'number', minimum: 0 },
          carbs_g: { type: 'number', minimum: 0 },
          fat_g: { type: 'number', minimum: 0 },
        },
      },
    },
    micros: {
      type: 'array',
      maxItems: 12,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'amount', 'unit', 'dailyPct'],
        properties: {
          name: { type: 'string' },
          amount: { type: 'number', minimum: 0 },
          unit: { type: 'string' },
          dailyPct: { type: 'number', minimum: 0 },
        },
      },
    },
    alternatives: { type: 'array', maxItems: 4, items: { type: 'string' } },
    assumptions: { type: 'array', maxItems: 6, items: { type: 'string' } },
    warning: { type: 'string' },
  },
};

const FOOD_INSTRUCTIONS = `You analyze meal photos for a food logging app.
Identify every visible edible component and estimate its portion in grams using visual scale cues such as plates, bowls, cups, and utensils.
Return nutrition estimates for the entire visible serving, not per 100 grams.
Calories and macros must be internally consistent. Include likely cooking oil, sauces, and dressings only when visually supported; disclose them as assumptions.
Choose the meal category from the provided enum based primarily on the food type, not the time of day.
When food is detected, return 10 to 12 useful micronutrients. Always include Omega-3 and estimate its percentage against a 1.6 g daily reference. Also prioritize sodium, potassium, calcium, iron, magnesium, zinc, vitamin C, vitamin D, vitamin B12, folate, vitamin A, and cholesterol when applicable. Do not include fiber here because it is already a macro field.
Cross-check calories against protein, carbohydrates, and fat using standard energy values, and make the component totals closely match the whole meal. Base estimates on common nutrition-reference values and disclose uncertain quantities or preparation methods.
Set confidence lower when ingredients, preparation, or scale are ambiguous.
If the image does not contain recognizable food or drink, set isFood false, use zero nutrition values, category unknown, and explain what is needed in warning.
This is an estimate from an image, not medical or dietary advice.`;

function outputText(payload) {
  if (typeof payload.output_text === 'string') return payload.output_text.trim();
  return (payload.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text)
    .join('')
    .trim();
}

function number(value, max = 100000) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(0, parsed)) : 0;
}

function normalizeMeal(meal) {
  const round = (value, digits = 1) => {
    const factor = 10 ** digits;
    return Math.round(number(value) * factor) / factor;
  };
  const macros = meal.macros || {};
  return {
    ...meal,
    isFood: Boolean(meal.isFood),
    label: String(meal.label || 'Unknown meal').slice(0, 120),
    confidence: Math.min(1, number(meal.confidence, 1)),
    calories: Math.round(number(meal.calories, 5000)),
    portion: {
      amount: round(meal.portion?.amount || 1),
      unit: String(meal.portion?.unit || 'serving').slice(0, 40),
      baseGrams: Math.round(number(meal.portion?.baseGrams, 5000)),
      grams: Math.round(number(meal.portion?.grams, 5000)),
    },
    macros: {
      protein_g: round(macros.protein_g, 1),
      carbs_g: round(macros.carbs_g, 1),
      fat_g: round(macros.fat_g, 1),
      fiber_g: round(macros.fiber_g, 1),
      sugar_g: round(macros.sugar_g, 1),
    },
    items: (meal.items || []).slice(0, 12).map((item) => ({
      name: String(item.name || 'Food item').slice(0, 80),
      estimatedGrams: Math.round(number(item.estimatedGrams, 5000)),
      calories: Math.round(number(item.calories, 5000)),
      protein_g: round(item.protein_g, 1),
      carbs_g: round(item.carbs_g, 1),
      fat_g: round(item.fat_g, 1),
    })),
    micros: (meal.micros || []).slice(0, 12).map((micro) => ({
      name: String(micro.name || 'Nutrient').slice(0, 60),
      amount: round(micro.amount, 1),
      unit: String(micro.unit || '').slice(0, 12),
      dailyPct: Math.round(number(micro.dailyPct, 1000)),
    })),
    alternatives: (meal.alternatives || []).slice(0, 4).map((item) => String(item).slice(0, 80)),
    assumptions: (meal.assumptions || []).slice(0, 6).map((item) => String(item).slice(0, 180)),
    warning: String(meal.warning || 'Nutrition is estimated from the visible image and may vary.').slice(0, 300),
  };
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function isRetryableError(status, code) {
  const nonRetryable429Codes = new Set([
    'credit_balance_exhausted',
    'organization_spend_limit_exceeded',
    'project_spend_limit_exceeded',
    'organization_usage_limit_exceeded',
  ]);
  if (status === 429) return !nonRetryable429Codes.has(code);
  return status === 408 || status === 409 || status >= 500;
}

async function requestStructuredMeal({ apiKey, body }) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) return payload;

      const error = new Error(payload?.error?.message || 'The nutrition service could not complete the analysis');
      error.status = response.status;
      error.code = payload?.error?.code;
      if (attempt === 0 && isRetryableError(error.status, error.code)) {
        const retryAfterSeconds = Number(response.headers.get('retry-after'));
        await wait(Number.isFinite(retryAfterSeconds) ? Math.min(retryAfterSeconds * 1000, 4000) : 900);
        continue;
      }
      throw error;
    } catch (error) {
      lastError = error;
      if (attempt === 0 && !error.status) {
        await wait(900);
        continue;
      }
      throw error;
    }
  }
  throw lastError || new Error('The nutrition service could not complete the analysis');
}

async function analyzeMeal({ apiKey, model, image, mimeType }) {
  const payload = await requestStructuredMeal({
    apiKey,
    body: {
      model,
      store: false,
      instructions: FOOD_INSTRUCTIONS,
      input: [{
        role: 'user',
        content: [
          { type: 'input_text', text: 'Analyze this meal photo and return the complete nutrition estimate.' },
          { type: 'input_image', image_url: `data:${mimeType};base64,${image}`, detail: 'high' },
        ],
      }],
      reasoning: { effort: 'medium' },
      max_output_tokens: 1800,
      text: {
        format: {
          type: 'json_schema',
          name: 'meal_analysis',
          strict: true,
          schema: MEAL_SCHEMA,
        },
      },
    },
  });

  const text = outputText(payload);
  if (!text) throw new Error('The vision service returned an empty analysis');
  try {
    return normalizeMeal(JSON.parse(text));
  } catch {
    const error = new Error('The vision service returned an unreadable analysis');
    error.code = 'invalid_analysis';
    throw error;
  }
}

async function analyzeMealText({ apiKey, model, description }) {
  const payload = await requestStructuredMeal({
    apiKey,
    body: {
      model,
      store: false,
      instructions: `${FOOD_INSTRUCTIONS}\nAnalyze the user's written food description instead of a photo. Use stated quantities when present. When quantity or preparation is missing, estimate one typical serving and clearly list that assumption.`,
      input: `Estimate the complete nutrition for this food entry: ${description}`,
      reasoning: { effort: 'low' },
      max_output_tokens: 1600,
      text: {
        format: {
          type: 'json_schema',
          name: 'typed_meal_analysis',
          strict: true,
          schema: MEAL_SCHEMA,
        },
      },
    },
  });
  const text = outputText(payload);
  if (!text) throw new Error('The nutrition service returned an empty analysis');
  return normalizeMeal(JSON.parse(text));
}

module.exports = { analyzeMeal, analyzeMealText, normalizeMeal, MEAL_SCHEMA };
