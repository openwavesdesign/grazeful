import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  currentWeight: number;
  goalWeight: number;
  height: number;
  age: number;
  targetPace: 'SLOW' | 'STEADY' | 'ACTIVE';
  weightUnit: 'LBS' | 'KG';
  dietaryRestrictions: string[];
  dislikedFoods?: string | null;
  cookTimePreference: 'QUICK' | 'MODERATE' | 'FULL';
  mealPlanPreferences?: Record<string, unknown> | null;
  favoriteMeals?: Meal[];
}

export interface WeightEntry {
  id: string;
  userId: string;
  weight: number;
  loggedAt: string;
  note?: string | null;
}

export interface MealSlot {
  name: string;
  description: string;
  healthScore: number;
  prepTimeMinutes: number;
  tags: string[];
}

export interface MealPlanDay {
  dayIndex: number;
  breakfast: MealSlot;
  lunch: MealSlot;
  dinner: MealSlot;
}

export interface MealPlan {
  id: string;
  userId: string;
  weekStartDate: string;
  generatedAt: string;
  planData: { days: MealPlanDay[] };
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
  isActive: boolean;
}

export interface MealLog {
  id: string;
  userId: string;
  mealId?: string | null;
  customMealName?: string | null;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  healthScore: number;
  feelingScore?: 'ENERGIZED' | 'NORMAL' | 'SLUGGISH' | 'HUNGRY' | null;
  loggedAt: string;
  wasPlanned: boolean;
  skipped: boolean;
  meal?: Meal | null;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  healthScore: number;
  prepTimeMinutes: number;
  tags: string[];
  userId?: string | null;
}

export interface Reminder {
  id: string;
  userId: string;
  label: string;
  isMealReminder: boolean;
  mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | null;
  inputType: 'YES_NO' | 'COUNT' | 'RATING';
  time: string;
  daysOfWeek: number[];
  isActive: boolean;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface GrazefulState {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;

  // Meal Plan
  currentMealPlan: MealPlan | null;
  setCurrentMealPlan: (plan: MealPlan | null) => void;

  // Today's logs
  todayLogs: MealLog[];
  setTodayLogs: (logs: MealLog[]) => void;
  addTodayLog: (log: MealLog) => void;

  // Weight history (recent)
  weightHistory: WeightEntry[];
  setWeightHistory: (entries: WeightEntry[]) => void;
  addWeightEntry: (entry: WeightEntry) => void;

  // Reminders
  reminders: Reminder[];
  setReminders: (reminders: Reminder[]) => void;
}

export const useStore = create<GrazefulState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  currentMealPlan: null,
  setCurrentMealPlan: (plan) => set({ currentMealPlan: plan }),

  todayLogs: [],
  setTodayLogs: (logs) => set({ todayLogs: logs }),
  addTodayLog: (log) => set((state) => ({ todayLogs: [...state.todayLogs, log] })),

  weightHistory: [],
  setWeightHistory: (entries) => set({ weightHistory: entries }),
  addWeightEntry: (entry) =>
    set((state) => ({
      weightHistory: [...state.weightHistory, entry].sort(
        (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()
      ),
    })),

  reminders: [],
  setReminders: (reminders) => set({ reminders }),
}));
