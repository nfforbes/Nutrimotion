/**
 * Seed weekly meal menus into MongoDB.
 *
 * Usage:
 *   node scripts/seed-weekly-meals.js
 *   node scripts/seed-weekly-meals.js --start 2026-07-05
 *   node scripts/seed-weekly-meals.js --clear   (remove meals in seeded date range first)
 */

const mongoose = require('mongoose');
const {
  WEEK_MENUS,
  getWeekStartSundayUtc,
  buildScheduledMeals,
} = require('./weekly-meal-menus');

const MealSlotValues = ['breakfast', 'lunch', 'smoothies', 'juice_shot'];

const MealPackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String },
    price: { type: Number, required: true, min: 0 },
    instagramLink: { type: String },
    slot: { type: String, enum: MealSlotValues, required: true },
    scheduledDate: { type: Date, required: true, index: true },
    available: { type: Boolean, default: true },
    ingredients: [String],
    nutritionInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
    },
  },
  { timestamps: true }
);

const MealPackage =
  mongoose.models.MealPackage || mongoose.model('MealPackage', MealPackageSchema);

function parseArgs() {
  const args = process.argv.slice(2);
  let startDate = null;
  let clear = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--start' && args[i + 1]) {
      startDate = new Date(args[++i] + 'T00:00:00.000Z');
    } else if (args[i] === '--clear') {
      clear = true;
    }
  }
  return { startDate, clear };
}

async function main() {
  const { startDate: startArg, clear } = parseArgs();
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nutrimotion';

  const week1Start = startArg
    ? getWeekStartSundayUtc(startArg)
    : getWeekStartSundayUtc(new Date());

  const weekStarts = WEEK_MENUS.map((_, i) => {
    const d = new Date(week1Start);
    d.setUTCDate(d.getUTCDate() + i * 7);
    return d;
  });

  const rangeEnd = new Date(weekStarts[weekStarts.length - 1]);
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 7);

  let allMeals = [];
  WEEK_MENUS.forEach((menu, i) => {
    allMeals.push(...buildScheduledMeals(weekStarts[i], menu));
  });

  console.log(`Connecting to ${MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI);

  if (clear) {
    const deleted = await MealPackage.deleteMany({
      scheduledDate: { $gte: weekStarts[0], $lt: rangeEnd },
    });
    console.log(`Cleared ${deleted.deletedCount} existing meals in range.`);
  }

  let created = 0;
  let updated = 0;

  for (const meal of allMeals) {
    const result = await MealPackage.findOneAndUpdate(
      {
        name: meal.name,
        slot: meal.slot,
        scheduledDate: meal.scheduledDate,
      },
      {
        $set: {
          description: meal.description,
          price: meal.price,
          imageUrl: '/placeholder-meal.jpg',
          available: true,
        },
        $setOnInsert: {
          name: meal.name,
          slot: meal.slot,
          scheduledDate: meal.scheduledDate,
        },
      },
      { upsert: true, returnDocument: 'after', rawResult: true }
    );

    if (result.lastErrorObject?.updatedExisting) {
      updated++;
    } else {
      created++;
    }
  }

  console.log('\nSeeded weekly menus:');
  WEEK_MENUS.forEach((menu, i) => {
    const start = weekStarts[i].toISOString().slice(0, 10);
    const end = new Date(weekStarts[i]);
    end.setUTCDate(end.getUTCDate() + 6);
    console.log(`  ${menu.label}: ${start} → ${end.toISOString().slice(0, 10)}`);
  });
  console.log(`\nDone: ${created} created, ${updated} updated (${allMeals.length} total slots).`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
