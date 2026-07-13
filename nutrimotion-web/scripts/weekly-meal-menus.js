/**
 * Weekly meal menu definitions — 4 weeks from provided meal plan images.
 * Each week: first 3 rows = breakfast, remaining = lunch (week 4 row 3 = smoothie).
 */

const WEEK_MENUS = [
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
    label: 'Week 2',
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
      'Blueberry pancakes',
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
    label: 'Week 4',
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

const SLOT = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  SMOOTHIES: 'smoothies',
};

const DEFAULT_PRICES = {
  [SLOT.BREAKFAST]: 12,
  [SLOT.LUNCH]: 15,
  [SLOT.SMOOTHIES]: 8,
};

/** Sunday 00:00 UTC for the week containing `anchor` (week starts Sunday). */
function getWeekStartSundayUtc(anchor) {
  const d = new Date(anchor);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - day);
  return d;
}

function addUtcDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function buildScheduledMeals(weekStartUtc, menu) {
  const meals = [];
  const { breakfasts, lunches, smoothies } = menu;

  for (let day = 0; day < 7; day++) {
    const scheduledDate = addUtcDays(weekStartUtc, day);

    for (const name of breakfasts) {
      meals.push({
        name,
        description: `Breakfast — ${name}`,
        slot: SLOT.BREAKFAST,
        scheduledDate,
        price: DEFAULT_PRICES[SLOT.BREAKFAST],
      });
    }

    for (const name of lunches) {
      meals.push({
        name,
        description: `Lunch — ${name}`,
        slot: SLOT.LUNCH,
        scheduledDate,
        price: DEFAULT_PRICES[SLOT.LUNCH],
      });
    }

    for (const name of smoothies) {
      meals.push({
        name,
        description: `Smoothie add-on — ${name}`,
        slot: SLOT.SMOOTHIES,
        scheduledDate,
        price: DEFAULT_PRICES[SLOT.SMOOTHIES],
      });
    }
  }

  return meals;
}

function getAllMealsFromMenus(weekStarts) {
  const all = [];
  WEEK_MENUS.forEach((menu, i) => {
    all.push(...buildScheduledMeals(weekStarts[i], menu));
  });
  return all;
}

module.exports = {
  WEEK_MENUS,
  SLOT,
  getWeekStartSundayUtc,
  buildScheduledMeals,
  getAllMealsFromMenus,
};
