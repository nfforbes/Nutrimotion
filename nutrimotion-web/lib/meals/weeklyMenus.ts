import { MealSlot } from '@/types/catalog';

export const MENU_PRICES: Record<string, number> = {
  [MealSlot.BREAKFAST]: 1200,
  [MealSlot.LUNCH]: 1500,
  [MealSlot.SMOOTHIES]: 8,
  [MealSlot.JUICE_SHOT]: 8,
};

export interface WeekMenu {
  label: string;
  breakfasts: string[];
  lunches: string[];
  smoothies: string[];
}

/** Menus from the meal plan. First rows are breakfast; week 4 includes a smoothie add-on. */
export const WEEK_MENUS: WeekMenu[] = [
  {
    label: 'Week 1',
    breakfasts: [
      'Blueberry protein pancakes',
      'Overnight protein oats',
      'Callaloo & sweet potato',
    ],
    lunches: [
      'Jerk BBQ chicken + vegetables + sweet potato',
      'Ground beef bowl + vegetables',
      'Fish rundown (tilapia) + string beans',
      'Curry chickpeas + pak choi + rice (optional)',
    ],
    smoothies: [],
  },
  {
    label: 'Week 2 - Menu B',
    breakfasts: [
      'High-protein oats',
      'Callaloo + green bananas',
      'Yogurt & fruit cup',
    ],
    lunches: [
      'Brown stew beef + vegetables',
      'Herb grilled chicken + pumpkin',
      'Coconut curry tilapia + vegetables',
      'Lentils + pumpkin + pak choi',
    ],
    smoothies: [],
  },
  {
    label: 'Week 3',
    breakfasts: [
      'Protein overnight oats',
      'Veggie protein breakfast bowl (chickpeas + veg)',
      'blueberry pancakes',
    ],
    lunches: [
      'Steamed/grilled chicken breast + vegetables + sweet potato',
      'Ground chicken bowl + vegetables',
      'Tilapia fillet + mixed vegetables',
      'Curry chickpeas + pumpkin + vegetables',
    ],
    smoothies: [],
  },
  {
    label: 'Week 4 - Menu 4',
    breakfasts: ['Callaloo & Yam', 'Fruit cup'],
    lunches: [
      'Herb oven-roasted chicken thighs + vegetables',
      'Stew beef + vegetables + pumpkin',
      'Spicy tilapia fillet + vegetables',
      'Vegetarian protein bowl (chickpeas + pumpkin + pak choi)',
    ],
    smoothies: ['Protein smoothie (optional add-on)'],
  },
];

export function weekStartSundayUtc(anchor: Date): Date {
  const d = new Date(anchor);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d;
}

function addUtcDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

export interface ScheduledMenuMeal {
  name: string;
  description: string;
  slot: MealSlot;
  scheduledDate: Date;
  price: number;
  menuLabel: string;
}

function slotMeals(menu: WeekMenu, slot: MealSlot, names: string[], weekStart: Date): ScheduledMenuMeal[] {
  const meals: ScheduledMenuMeal[] = [];
  const slotLabel =
    slot === MealSlot.BREAKFAST ? 'Breakfast' : slot === MealSlot.LUNCH ? 'Lunch' : 'Smoothie';
  for (let day = 0; day < 7; day++) {
    const scheduledDate = addUtcDays(weekStart, day);
    for (const name of names) {
      meals.push({
        name,
        description: `${slotLabel} — ${name}`,
        slot,
        scheduledDate,
        price: MENU_PRICES[slot],
        menuLabel: menu.label,
      });
    }
  }
  return meals;
}

export function buildMenuMeals(week1Start: Date): ScheduledMenuMeal[] {
  const start = weekStartSundayUtc(week1Start);
  const meals: ScheduledMenuMeal[] = [];
  WEEK_MENUS.forEach((menu, index) => {
    const weekStart = addUtcDays(start, index * 7);
    meals.push(
      ...slotMeals(menu, MealSlot.BREAKFAST, menu.breakfasts, weekStart),
      ...slotMeals(menu, MealSlot.LUNCH, menu.lunches, weekStart),
      ...slotMeals(menu, MealSlot.SMOOTHIES, menu.smoothies, weekStart)
    );
  });
  return meals;
}
