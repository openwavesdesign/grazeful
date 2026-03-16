# Grazeful — Product Specification
> React Native app (iOS + Android) | AI-powered health companion | Low-friction meal tracking & weight logging

---

## 🎯 Project Overview

**App Name:** Grazeful  
**Platform:** React Native + Expo (iOS + Android)  
**AI Engine:** Anthropic Claude API (`claude-sonnet-4-20250514`)  
**Backend:** Node.js + PostgreSQL + Prisma  
**Auth:** Clerk  
**Push Notifications:** Expo Push Notifications  
**Charts:** Victory Native  

### Core Problem
Most health apps fail because logging is too hard. Users give up. Grazeful solves this with:
- 15-second meal check-ins (no calorie counting, no typing)
- AI-generated meal plans so users never have to decide what to eat
- No-shame design — missed check-ins are silently skipped, never punished

### Design Principles
1. Every interaction takes ≤15 seconds
2. Pre-populated choices, not blank text fields
3. AI does the heavy lifting (meal plans, grocery lists, insights)
4. Calm, low-pressure tone throughout — never shame the user
5. Gentle momentum — celebrate wins without pressure

---

## 🗂️ Folder Structure

```
grazeful/
├── apps/
│   └── mobile/                  # React Native + Expo app
│       ├── app/                 # Expo Router (file-based routing)
│       │   ├── (tabs)/
│       │   │   ├── index.tsx        # Home Dashboard
│       │   │   ├── meals.tsx        # Meal Plan
│       │   │   ├── progress.tsx     # Progress / Charts
│       │   │   └── settings.tsx     # Settings
│       │   ├── onboarding/
│       │   │   ├── welcome.tsx
│       │   │   ├── profile.tsx
│       │   │   ├── eating-style.tsx
│       │   │   ├── meal-times.tsx
│       │   │   └── ready.tsx
│       │   └── modals/
│       │       ├── meal-checkin.tsx
│       │       ├── weight-log.tsx
│       │       └── add-reminder.tsx
│       ├── components/
│       ├── hooks/
│       ├── store/               # Zustand state
│       └── lib/                 # API client, utils
├── packages/
│   └── api/                     # tRPC or REST API (Next.js or Express)
│       ├── routes/
│       ├── services/
│       │   └── ai.ts            # Claude API integration
│       └── prisma/
│           └── schema.prisma
└── package.json                 # Monorepo root (npm workspaces or Turborepo)
```

---

## 🗃️ Database Schema (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum WeightUnit {
  LBS
  KG
}

enum TargetPace {
  SLOW    // 0.5 lb/week
  STEADY  // 1.0 lb/week
  ACTIVE  // 1.5 lb/week
}

enum CookTimePreference {
  QUICK      // under 10 min
  MODERATE   // 10–30 min
  FULL       // 30+ min
}

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
}

enum ReminderInputType {
  YES_NO
  COUNT
  RATING
}

enum FeelingScore {
  ENERGIZED
  NORMAL
  SLUGGISH
  HUNGRY
}

model User {
  id                   String             @id @default(uuid())
  clerkId              String             @unique
  email                String             @unique
  name                 String
  createdAt            DateTime           @default(now())
  currentWeight        Float
  goalWeight           Float
  height               Int                // inches
  age                  Int
  targetPace           TargetPace         @default(STEADY)
  weightUnit           WeightUnit         @default(LBS)
  dietaryRestrictions  String[]
  dislikedFoods        String?
  cookTimePreference   CookTimePreference @default(MODERATE)
  mealPlanPreferences  Json?

  weightEntries        WeightEntry[]
  mealPlans            MealPlan[]
  mealLogs             MealLog[]
  favoriteMeals        Meal[]             @relation("FavoriteMeals")
  reminders            Reminder[]
  reminderLogs         ReminderLog[]
}

model WeightEntry {
  id        String   @id @default(uuid())
  userId    String
  weight    Float
  loggedAt  DateTime @default(now())
  note      String?

  user      User     @relation(fields: [userId], references: [id])
}

model MealPlan {
  id                String   @id @default(uuid())
  userId            String
  weekStartDate     DateTime
  generatedAt       DateTime @default(now())
  planData          Json     // full 7-day plan
  groceryList       Json     // grouped by store section
  prepInstructions  Json     // step-by-step
  isActive          Boolean  @default(true)

  user              User     @relation(fields: [userId], references: [id])
}

model Meal {
  id              String    @id @default(uuid())
  name            String
  description     String
  mealType        MealType
  healthScore     Int       // 1–5, AI-assigned
  prepTimeMinutes Int
  tags            String[]
  userId          String?   // null = system meal

  favoritedBy     User[]    @relation("FavoriteMeals")
  mealLogs        MealLog[]
}

model MealLog {
  id             String        @id @default(uuid())
  userId         String
  mealId         String?
  customMealName String?
  mealType       MealType
  healthScore    Int           // 1–5, user-selected
  feelingScore   FeelingScore?
  loggedAt       DateTime      @default(now())
  wasPlanned     Boolean       @default(false)
  skipped        Boolean       @default(false)

  user           User          @relation(fields: [userId], references: [id])
  meal           Meal?         @relation(fields: [mealId], references: [id])
}

model Reminder {
  id            String            @id @default(uuid())
  userId        String
  label         String
  isMealReminder Boolean          @default(false)
  mealType      MealType?
  inputType     ReminderInputType @default(YES_NO)
  time          String            // "HH:MM"
  daysOfWeek    Int[]             // 0=Sun … 6=Sat
  isActive      Boolean           @default(true)

  user          User              @relation(fields: [userId], references: [id])
  logs          ReminderLog[]
}

model ReminderLog {
  id          String   @id @default(uuid())
  reminderId  String
  userId      String
  response    String
  loggedAt    DateTime @default(now())

  reminder    Reminder @relation(fields: [reminderId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
}
```

---

## 🔌 API Endpoints

All routes require authentication via Clerk JWT. User ID is derived from the token.

### Weight
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/weight` | Log a new weight entry |
| GET | `/api/weight` | Get weight history (optional `?from=&to=` date range) |
| PATCH | `/api/weight/:id` | Edit a weight entry |
| DELETE | `/api/weight/:id` | Delete a weight entry |

### Meal Plan
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/meal-plan/generate` | Trigger AI generation for current week |
| GET | `/api/meal-plan/current` | Get active meal plan |
| PATCH | `/api/meal-plan/:mealId/regenerate` | Regenerate a single meal via AI |
| POST | `/api/meal-plan/:mealId/favorite` | Toggle favorite on a meal |

### Meal Log
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/meal-log` | Log a meal check-in |
| GET | `/api/meal-log` | Get history (paginated) |
| GET | `/api/meal-log/today` | Get today's check-ins |

### Reminders
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/reminders` | List all user reminders |
| POST | `/api/reminders` | Create a new reminder |
| PATCH | `/api/reminders/:id` | Update reminder settings |
| DELETE | `/api/reminders/:id` | Delete a reminder |
| POST | `/api/reminder-log` | Log a reminder response |

### Summary & Insights
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/summary/weekly` | Get weekly summary data |
| GET | `/api/summary/insights` | Get AI-generated insight for current week |

---

## 🤖 AI Integration (Claude API)

### Meal Plan Generation

**Endpoint called:** `POST /api/meal-plan/generate`  
**Model:** `claude-sonnet-4-20250514`  
**Max tokens:** 4000

**System prompt:**
```
You are a friendly, practical nutritionist and meal planner. Generate simple, 
repeatable meal plans for busy people. Prioritize meals that are quick to prepare, 
require minimal ingredients, and fit the user's dietary restrictions and preferences.
Always respond with valid JSON only — no preamble, no markdown, no explanation.
```

**User prompt payload:**
```json
{
  "dietaryRestrictions": ["low-sodium"],
  "dislikedFoods": "Swiss cheese",
  "cookTimePreference": "QUICK",
  "breakfastPreferences": ["eggs", "smoothies", "fruit"],
  "lunchPreferences": ["sandwiches"],
  "daysToGenerate": 7,
  "favoriteMeals": []
}
```

**Expected response schema:**
```json
{
  "days": [
    {
      "dayIndex": 0,
      "breakfast": { "name": "", "description": "", "healthScore": 4, "prepTimeMinutes": 7, "tags": [] },
      "lunch":     { "name": "", "description": "", "healthScore": 4, "prepTimeMinutes": 5, "tags": [] },
      "dinner":    { "name": "", "description": "", "healthScore": 4, "prepTimeMinutes": 20, "tags": [] }
    }
  ],
  "groceryList": {
    "produce": [],
    "proteins": [],
    "dairyAndEggs": [],
    "frozen": [],
    "pantry": [],
    "other": []
  },
  "prepInstructions": [
    { "step": 1, "title": "", "description": "", "estimatedMinutes": 0 }
  ],
  "totalPrepTimeMinutes": 20
}
```

**Error handling:** If JSON parse fails, retry once with stricter prompt appended: `"IMPORTANT: Your entire response must be a single valid JSON object. Do not include any text before or after the JSON."`

**Rate limit:** Max 3 regenerations per user per day.

---

### Weekly Insight Generation

**Endpoint called:** `GET /api/summary/insights`  
**Model:** `claude-sonnet-4-20250514`  
**Max tokens:** 300

**System prompt:**
```
You are a supportive, calm health coach. Given a user's weekly health data, 
provide one encouraging insight (1–2 sentences) and one gentle suggestion 
(1 sentence). Be warm and specific. Never shame or lecture. 
Respond with valid JSON only.
```

**User prompt payload:**
```json
{
  "weeklyAvgHealthScore": 3.8,
  "weightChangeLbs": -1.2,
  "checkInStreak": 5,
  "totalCheckIns": 14,
  "bestDay": "Wednesday",
  "missedMeals": 4
}
```

**Expected response schema:**
```json
{
  "insight": "You had a great week — down 1.2 lbs and your Wednesday meals were especially strong.",
  "suggestion": "Try prepping your lunch the night before to keep that momentum going into the weekend."
}
```

---

## 📱 Screens & Navigation

### Tab Navigation (Bottom Tabs)

```
Tab 1: 🏠 Home     → Dashboard
Tab 2: 🍽️ Meals    → Meal Plan
Tab 3: 📊 Progress → Weight Chart + History
Tab 4: ⚙️ Settings → Profile + Reminders
```

---

### Onboarding Flow (shown once, before tabs)

**Screen 1 — Welcome**
- App logo, tagline: "Eat well. Feel good. No pressure."
- Single CTA button: "Get Started"

**Screen 2 — Your Profile**
- Fields: First name, current weight, goal weight, height, age
- Weight unit toggle: lbs / kg
- Target pace selector: Slow & Steady (0.5/wk) | Steady (1/wk) | Active (1.5/wk)

**Screen 3 — Your Eating Style**
- "What do you usually eat for breakfast?" — multi-select chips: Eggs, Smoothies, Fruit, Oatmeal, Yogurt, Other
- "What about lunch?" — multi-select chips: Sandwiches, Salads, Leftovers, Soup, Other
- Dietary restrictions — multi-select chips: Low sodium, Vegetarian, Vegan, Gluten-free, Dairy-free, None
- Disliked foods — optional free text field
- Cook time preference — 3-option selector

**Screen 4 — Meal Times**
- Time pickers for breakfast, lunch, dinner
- Toggle to enable/disable each reminder
- Note: "You can always change these in settings"

**Screen 5 — Ready!**
- Summary of name + goal
- "Generating your first meal plan…" loading state
- Transitions to Home tab once plan is ready

---

### Tab 1: Home Dashboard

**Sections (top to bottom):**
1. Greeting: "Good morning, [Name]" + today's date
2. Weight Snapshot card: current | goal | lbs remaining | projected date
3. Today's Meals: 3 cards (Breakfast / Lunch / Dinner) showing planned meal + check-in status badge (✅ Logged / ⏳ Pending / ⏭️ Skipped)
4. Quick Log Weight button
5. Streak badge: "🔥 5-day streak"
6. Weekly health score bar: Mon–Sun with color-coded scores

**Interactions:**
- Tap weight snapshot → opens Weight Log Modal
- Tap any meal card → opens Meal Check-In Modal
- Tap "Quick Log Weight" → opens Weight Log Modal

---

### Tab 2: Meals

**Sub-sections (segmented control or tabs):**
- **This Week** — 7-day meal plan grid. Each cell shows meal name + health score dot. Tap to see detail.
- **Grocery List** — grouped by store section, checkboxes, share button
- **Prep Guide** — collapsible step-by-step Sunday prep instructions
- **Favorites** — saved meals, tap to view detail

**Meal Detail Sheet (bottom sheet):**
- Meal name, description, health score, prep time, tags
- "Regenerate" button (replaces this meal with AI-generated alternative)
- "Add to Favorites" toggle

---

### Tab 3: Progress

**Weight Chart:**
- Line chart: actual weight over time
- Projected trend line to goal (dashed)
- Goal line (horizontal dashed)
- Milestone markers: every 5 lbs, 25/50/75/100% of goal
- Time range selector: 2W | 1M | 3M | All

**Check-In History:**
- Scrollable list of past meal logs
- Each entry: meal name, health score emoji, meal type, timestamp
- Filter by meal type

**Weekly Summary Card:**
- Avg health score, weight change, streak, AI insight, suggestion

---

### Tab 4: Settings

- **Profile** — edit name, weight, goal, height, age, units
- **Meal Preferences** — edit dietary restrictions, dislikes, cook time (re-triggers meal plan generation)
- **Reminders** — list of all reminders (meal + custom), toggle on/off, edit time
- **Add Custom Reminder** — label, type (yes/no | count | rating), time, days of week
- **Notifications** — master on/off, per-reminder controls
- **About** — version, feedback link

---

### Modals

**Meal Check-In Modal** (triggered by notification or tapping a meal card)

Step 1 — What did you eat?
- Option A: Today's planned meal (large primary button)
- Option B: Recent meals (horizontal scrollable chips, last 10)
- Option C: "Something else" (text input, optional)
- Option D: "Skipped this meal" (secondary button)

Step 2 — How healthy was it? (1–5 emoji scale)
- 5 🥗 Super healthy
- 4 😊 Pretty good
- 3 😐 Okay
- 2 😬 Not great
- 1 🍕 Treat meal

Step 3 — How do you feel? (optional, one tap)
- Energized / Normal / Sluggish / Hungry
- "Skip" button prominently visible

Post check-in: brief animation + friendly message. If score = 1: "Everyone deserves a treat — enjoy it guilt-free!"

**Weight Log Modal**
- Pre-filled with last logged weight
- Number input (large, easy to tap)
- Confirm button
- Optional note field

**Add Custom Reminder (Bottom Sheet)**
- Label / question text
- Input type: Yes/No | Count | Rating 1–5
- Time picker
- Days of week selector (M T W T F S S toggles)
- Save button

---

## 🔔 Push Notification Strategy

- **Meal reminders:** fire at user-set times (breakfast/lunch/dinner), deep link to Meal Check-In Modal
- **Custom reminders:** fire at user-set times, deep link to custom check-in flow
- **Weekly summary:** fires Sunday at 7pm, deep link to Progress tab
- **Milestone alerts:** fires when weight milestone hit ("You've lost 5 lbs! 🎉")
- All notifications use Expo Push Notifications
- Notification payload includes `type` and relevant `id` for deep linking

---

## 📊 Projection Algorithm

```typescript
function projectGoalDate(entries: WeightEntry[], goalWeight: number, targetPace: TargetPace): Date {
  if (entries.length < 7) {
    // Not enough data — use target pace
    const pacePerWeek = targetPace === 'SLOW' ? 0.5 : targetPace === 'STEADY' ? 1.0 : 1.5;
    const currentWeight = entries[entries.length - 1]?.weight ?? 0;
    const lbsToGo = currentWeight - goalWeight;
    const weeksToGo = lbsToGo / pacePerWeek;
    return addWeeks(new Date(), weeksToGo);
  }
  // Use actual 14-day trend
  const recent = entries.slice(-14);
  const slope = calculateLinearRegressionSlope(recent); // lbs per day (negative = losing)
  const current = recent[recent.length - 1].weight;
  const daysToGo = (current - goalWeight) / Math.abs(slope);
  return addDays(new Date(), daysToGo);
}
```

---

## 🎨 Design Tokens

```typescript
export const colors = {
  primary: '#2D7A4F',
  primaryLight: '#E8F5EE',
  dark: '#1A1A1A',
  gray: '#666666',
  border: '#E0E0E0',
  background: '#F9F9F9',
  white: '#FFFFFF',
  warning: '#F0A500',
  error: '#D93025',
  score5: '#2D7A4F', // super healthy
  score4: '#6BBF6B', // pretty good
  score3: '#F0A500', // okay
  score2: '#E07830', // not great
  score1: '#D93025', // treat meal
};

export const typography = {
  heading1: { fontSize: 28, fontWeight: '700' },
  heading2: { fontSize: 22, fontWeight: '700' },
  heading3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  small: { fontSize: 13, fontWeight: '400' },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
};

export const radius = {
  sm: 6, md: 12, lg: 20, full: 999
};
```

---

## 🚀 Build Phases

### Phase 1 — MVP (Weeks 1–4)
Build in this order:

1. **Project setup** — Expo + monorepo + Prisma + Clerk auth
2. **Database** — run migrations, seed with sample meals
3. **Onboarding flow** — all 5 screens, saves to DB on completion
4. **Home dashboard** — weight snapshot, today's meals (static data ok)
5. **Weight logging** — modal + chart (Victory Native)
6. **Meal check-in** — modal flow, logs to DB (manual trigger, no notifications yet)
7. **AI meal plan generation** — Claude API integration, display on Meals tab
8. **Grocery list** — rendered from meal plan JSON

### Phase 2 — Core Experience (Weeks 5–8)
9. Push notifications (meal reminders)
10. Custom reminders + reminder log
11. Weekly summary screen + AI insight generation
12. Prep instructions screen
13. Favorites system
14. Progress chart improvements (trend line, milestones)
15. Grocery list checkboxes + share

### Phase 3 — Polish (Weeks 9–12)
16. Photo meal logging (AI auto-tags)
17. Apple HealthKit / Google Fit integration
18. AI chat: "How am I doing?"
19. Dark mode
20. Partner / accountability mode
21. App Store + Google Play submission

---

## ⚙️ Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Clerk
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...

# Expo
EXPO_PUBLIC_API_URL=https://...
```

---

## 📝 Claude Code Instructions

When scaffolding this project, please:

1. **Start with Phase 1 only** — do not scaffold Phase 2 or 3 features yet
2. **Run `prisma migrate dev`** after generating the schema
3. **Seed the database** with 20 sample meals (varied breakfast/lunch/dinner, low-sodium tagged)
4. **Use NativeWind** for all styling — no StyleSheet.create
5. **Use Zustand** for client state (auth state, current meal plan, today's logs)
6. **Use the design tokens above** — define them in `lib/tokens.ts` and import everywhere
7. **Implement the Claude API service** in `packages/api/services/ai.ts` with the exact prompts and response schemas above
8. **All AI calls must go through the server** — never expose the API key to the client
9. **After each phase, commit with message:** `feat: phase-1-complete`, `feat: phase-2-complete`, etc.
10. **Ask before making architectural decisions** not covered in this spec
