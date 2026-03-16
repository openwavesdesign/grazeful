import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-20250514';

// ─── Meal Plan Generation ─────────────────────────────────────────────────────

export interface MealPlanInput {
  dietaryRestrictions: string[];
  dislikedFoods?: string | null;
  cookTimePreference: string;
  breakfastPreferences?: string[];
  lunchPreferences?: string[];
  daysToGenerate?: number;
  favoriteMeals?: string[];
}

export interface MealPlanOutput {
  days: Array<{
    dayIndex: number;
    breakfast: MealSlot;
    lunch: MealSlot;
    dinner: MealSlot;
  }>;
  groceryList: {
    produce: string[];
    proteins: string[];
    dairyAndEggs: string[];
    frozen: string[];
    pantry: string[];
    other: string[];
  };
  prepInstructions: Array<{
    step: number;
    title: string;
    description: string;
    estimatedMinutes: number;
  }>;
  totalPrepTimeMinutes: number;
}

interface MealSlot {
  name: string;
  description: string;
  healthScore: number;
  prepTimeMinutes: number;
  tags: string[];
}

const MEAL_PLAN_SYSTEM_PROMPT = `You are a friendly, practical nutritionist and meal planner. Generate simple, repeatable meal plans for busy people. Prioritize meals that are quick to prepare, require minimal ingredients, and fit the user's dietary restrictions and preferences.
Always respond with valid JSON only — no preamble, no markdown, no explanation.`;

const STRICT_JSON_SUFFIX =
  'IMPORTANT: Your entire response must be a single valid JSON object. Do not include any text before or after the JSON.';

export async function generateMealPlan(input: MealPlanInput): Promise<MealPlanOutput> {
  const userPrompt = JSON.stringify({
    dietaryRestrictions: input.dietaryRestrictions,
    dislikedFoods: input.dislikedFoods || null,
    cookTimePreference: input.cookTimePreference,
    breakfastPreferences: input.breakfastPreferences || [],
    lunchPreferences: input.lunchPreferences || [],
    daysToGenerate: input.daysToGenerate ?? 7,
    favoriteMeals: input.favoriteMeals || [],
  });

  const attempt = async (prompt: string): Promise<MealPlanOutput> => {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: MEAL_PLAN_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(text) as MealPlanOutput;
  };

  try {
    return await attempt(userPrompt);
  } catch {
    // Retry once with strict prompt
    return await attempt(userPrompt + '\n' + STRICT_JSON_SUFFIX);
  }
}

// ─── Single Meal Regeneration ─────────────────────────────────────────────────

export async function regenerateMeal(
  mealType: string,
  input: MealPlanInput
): Promise<MealSlot> {
  const userPrompt =
    `Generate a single ${mealType.toLowerCase()} meal as JSON with fields: name, description, healthScore (1–5), prepTimeMinutes, tags (array of strings). ` +
    `User preferences: ${JSON.stringify({
      dietaryRestrictions: input.dietaryRestrictions,
      dislikedFoods: input.dislikedFoods,
      cookTimePreference: input.cookTimePreference,
    })}. ` +
    STRICT_JSON_SUFFIX;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: MEAL_PLAN_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return JSON.parse(text) as MealSlot;
}

// ─── Weekly Insight Generation ────────────────────────────────────────────────

export interface WeeklyInsightInput {
  weeklyAvgHealthScore: number;
  weightChangeLbs: number;
  checkInStreak: number;
  totalCheckIns: number;
  bestDay: string;
  missedMeals: number;
}

export interface WeeklyInsightOutput {
  insight: string;
  suggestion: string;
}

const INSIGHT_SYSTEM_PROMPT = `You are a supportive, calm health coach. Given a user's weekly health data, provide one encouraging insight (1–2 sentences) and one gentle suggestion (1 sentence). Be warm and specific. Never shame or lecture.
Respond with valid JSON only.`;

export async function generateWeeklyInsight(
  input: WeeklyInsightInput
): Promise<WeeklyInsightOutput> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: INSIGHT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(input) }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return JSON.parse(text) as WeeklyInsightOutput;
}
