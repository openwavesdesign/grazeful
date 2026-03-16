import Constants from 'expo-constants';

const BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string) ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:3000';

let _token: string | null = null;

export function setAuthToken(token: string | null) {
  _token = token;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error?.error || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Users
  onboard: (data: unknown) => request('POST', '/api/users/onboard', data),
  getMe: () => request('GET', '/api/users/me'),
  updateMe: (data: unknown) => request('PATCH', '/api/users/me', data),

  // Weight
  logWeight: (data: unknown) => request('POST', '/api/weight', data),
  getWeightHistory: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return request('GET', `/api/weight?${params}`);
  },
  updateWeight: (id: string, data: unknown) => request('PATCH', `/api/weight/${id}`, data),
  deleteWeight: (id: string) => request('DELETE', `/api/weight/${id}`),

  // Meal Plan
  generateMealPlan: () => request('POST', '/api/meal-plan/generate'),
  getCurrentMealPlan: () => request('GET', '/api/meal-plan/current'),
  regenerateMeal: (dayIndex: number, mealType: string) =>
    request('PATCH', `/api/meal-plan/${dayIndex}/regenerate`, { mealType }),
  toggleFavorite: (mealId: string) =>
    request('POST', `/api/meal-plan/${mealId}/favorite`),

  // Meal Log
  logMeal: (data: unknown) => request('POST', '/api/meal-log', data),
  getMealLogs: (page = 1) => request('GET', `/api/meal-log?page=${page}`),
  getTodayLogs: () => request('GET', '/api/meal-log/today'),

  // Reminders
  getReminders: () => request('GET', '/api/reminders'),
  createReminder: (data: unknown) => request('POST', '/api/reminders', data),
  updateReminder: (id: string, data: unknown) => request('PATCH', `/api/reminders/${id}`, data),
  deleteReminder: (id: string) => request('DELETE', `/api/reminders/${id}`),
  logReminderResponse: (data: unknown) => request('POST', '/api/reminder-log/log', data),

  // Summary
  getWeeklySummary: () => request('GET', '/api/summary/weekly'),
  getWeeklyInsight: () => request('GET', '/api/summary/insights'),
};
