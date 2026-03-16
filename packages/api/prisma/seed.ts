import { PrismaClient, MealType } from '@prisma/client';

const prisma = new PrismaClient();

const meals = [
  // BREAKFAST
  {
    name: 'Scrambled Eggs & Toast',
    description: 'Fluffy scrambled eggs on whole wheat toast with a side of fresh fruit.',
    mealType: MealType.BREAKFAST,
    healthScore: 4,
    prepTimeMinutes: 8,
    tags: ['low-sodium', 'high-protein', 'quick'],
  },
  {
    name: 'Berry Smoothie',
    description: 'Blended mixed berries, banana, Greek yogurt, and a splash of almond milk.',
    mealType: MealType.BREAKFAST,
    healthScore: 5,
    prepTimeMinutes: 5,
    tags: ['low-sodium', 'vegetarian', 'quick'],
  },
  {
    name: 'Overnight Oats',
    description: 'Rolled oats soaked overnight with chia seeds, honey, and sliced strawberries.',
    mealType: MealType.BREAKFAST,
    healthScore: 5,
    prepTimeMinutes: 5,
    tags: ['low-sodium', 'vegetarian', 'prep-ahead'],
  },
  {
    name: 'Avocado Toast',
    description: 'Smashed avocado on multigrain toast with a poached egg and red pepper flakes.',
    mealType: MealType.BREAKFAST,
    healthScore: 5,
    prepTimeMinutes: 10,
    tags: ['vegetarian', 'high-protein'],
  },
  {
    name: 'Greek Yogurt Parfait',
    description: 'Layered Greek yogurt, granola, and fresh blueberries with a drizzle of honey.',
    mealType: MealType.BREAKFAST,
    healthScore: 4,
    prepTimeMinutes: 3,
    tags: ['low-sodium', 'vegetarian', 'quick'],
  },
  {
    name: 'Veggie Omelette',
    description: 'Three-egg omelette filled with spinach, bell peppers, mushrooms, and feta.',
    mealType: MealType.BREAKFAST,
    healthScore: 5,
    prepTimeMinutes: 12,
    tags: ['low-sodium', 'vegetarian', 'high-protein'],
  },
  {
    name: 'Banana Peanut Butter Toast',
    description: 'Whole grain toast with natural peanut butter and sliced banana.',
    mealType: MealType.BREAKFAST,
    healthScore: 4,
    prepTimeMinutes: 3,
    tags: ['vegetarian', 'quick'],
  },
  // LUNCH
  {
    name: 'Grilled Chicken Salad',
    description: 'Romaine lettuce, grilled chicken breast, cherry tomatoes, cucumber, and lemon vinaigrette.',
    mealType: MealType.LUNCH,
    healthScore: 5,
    prepTimeMinutes: 15,
    tags: ['low-sodium', 'high-protein', 'gluten-free'],
  },
  {
    name: 'Turkey & Avocado Wrap',
    description: 'Whole wheat tortilla with sliced turkey, avocado, lettuce, and mustard.',
    mealType: MealType.LUNCH,
    healthScore: 4,
    prepTimeMinutes: 7,
    tags: ['high-protein', 'quick'],
  },
  {
    name: 'Lentil Soup',
    description: 'Hearty red lentil soup with cumin, turmeric, and fresh lemon — made in one pot.',
    mealType: MealType.LUNCH,
    healthScore: 5,
    prepTimeMinutes: 30,
    tags: ['low-sodium', 'vegan', 'gluten-free'],
  },
  {
    name: 'Quinoa Buddha Bowl',
    description: 'Quinoa with roasted chickpeas, kale, shredded carrots, and tahini dressing.',
    mealType: MealType.LUNCH,
    healthScore: 5,
    prepTimeMinutes: 20,
    tags: ['low-sodium', 'vegan', 'gluten-free'],
  },
  {
    name: 'Tuna Salad Sandwich',
    description: 'Light tuna salad with celery and Greek yogurt on whole wheat bread.',
    mealType: MealType.LUNCH,
    healthScore: 4,
    prepTimeMinutes: 7,
    tags: ['high-protein', 'quick'],
  },
  {
    name: 'Caprese Salad',
    description: 'Fresh mozzarella, sliced tomatoes, basil, and a drizzle of olive oil and balsamic.',
    mealType: MealType.LUNCH,
    healthScore: 4,
    prepTimeMinutes: 5,
    tags: ['low-sodium', 'vegetarian', 'gluten-free', 'quick'],
  },
  // DINNER
  {
    name: 'Baked Salmon with Roasted Veggies',
    description: 'Lemon-herb salmon fillet with roasted broccoli and sweet potato.',
    mealType: MealType.DINNER,
    healthScore: 5,
    prepTimeMinutes: 25,
    tags: ['low-sodium', 'gluten-free', 'high-protein'],
  },
  {
    name: 'Chicken Stir-Fry',
    description: 'Lean chicken strips with bell peppers, snap peas, and brown rice in a light ginger sauce.',
    mealType: MealType.DINNER,
    healthScore: 4,
    prepTimeMinutes: 20,
    tags: ['high-protein', 'gluten-free'],
  },
  {
    name: 'Black Bean Tacos',
    description: 'Corn tortillas with seasoned black beans, cabbage slaw, salsa, and lime crema.',
    mealType: MealType.DINNER,
    healthScore: 4,
    prepTimeMinutes: 15,
    tags: ['low-sodium', 'vegan', 'gluten-free'],
  },
  {
    name: 'Spaghetti Squash Marinara',
    description: 'Roasted spaghetti squash with homemade low-sodium tomato sauce and fresh basil.',
    mealType: MealType.DINNER,
    healthScore: 5,
    prepTimeMinutes: 40,
    tags: ['low-sodium', 'vegan', 'gluten-free'],
  },
  {
    name: 'Turkey Meatball Bowl',
    description: 'Baked turkey meatballs over zucchini noodles with marinara sauce.',
    mealType: MealType.DINNER,
    healthScore: 5,
    prepTimeMinutes: 30,
    tags: ['low-sodium', 'gluten-free', 'high-protein'],
  },
  {
    name: 'Sheet Pan Chicken & Veggies',
    description: 'Chicken thighs roasted with asparagus, cherry tomatoes, and lemon on a single pan.',
    mealType: MealType.DINNER,
    healthScore: 5,
    prepTimeMinutes: 35,
    tags: ['low-sodium', 'gluten-free', 'high-protein'],
  },
  {
    name: 'Veggie Fried Rice',
    description: 'Brown rice stir-fried with egg, edamame, carrots, and a light soy-ginger sauce.',
    mealType: MealType.DINNER,
    healthScore: 4,
    prepTimeMinutes: 20,
    tags: ['vegetarian'],
  },
];

async function main() {
  console.log('Seeding 20 sample meals...');

  // Clear existing system meals (userId = null) before re-seeding
  await prisma.meal.deleteMany({ where: { userId: null } });
  await prisma.meal.createMany({ data: meals });

  console.log(`Seeded ${meals.length} meals.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
