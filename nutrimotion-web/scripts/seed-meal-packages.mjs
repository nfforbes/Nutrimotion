/**
 * Upsert meal packages. Prices are whole JMD amounts.
 * Lunch-and-dinner sizes store the meal count as lunches.
 * Full-day sizes split the meals across breakfast, lunch, and dinner.
 *
 * Usage: MONGODB_URI=... node scripts/seed-meal-packages.mjs
 */
import dns from 'node:dns';
import mongoose from 'mongoose';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const packages = [
  {
    name: 'Weekly · 5 Meals',
    description: 'Weekly package (lunch & dinner only)',
    lunchCount: 5,
    cost: 9500,
  },
  {
    name: 'Weekly · 7 Meals',
    description: 'Weekly package (lunch & dinner only)',
    lunchCount: 7,
    cost: 13500,
  },
  {
    name: 'Weekly · 10 Meals',
    description: 'Weekly package (lunch & dinner only)',
    lunchCount: 10,
    cost: 17000,
  },
  {
    name: 'Weekly · 14 Meals',
    description: 'Weekly package (lunch & dinner only)',
    lunchCount: 14,
    cost: 23500,
  },
  {
    name: '2 Weeks · 10 Meals',
    description: '2 weeks package (lunch & dinner only)',
    lunchCount: 10,
    cost: 18000,
  },
  {
    name: '2 Weeks · 14 Meals',
    description: '2 weeks package (lunch & dinner only)',
    lunchCount: 14,
    cost: 25500,
  },
  {
    name: '2 Weeks · 20 Meals',
    description: '2 weeks package (lunch & dinner only)',
    lunchCount: 20,
    cost: 32000,
  },
  {
    name: '2 Weeks · 28 Meals',
    description: '2 weeks package (lunch & dinner only)',
    lunchCount: 28,
    cost: 44000,
  },
  {
    name: 'Monthly · 20 Meals',
    description: 'Monthly package (5 per week, lunch & dinner only)',
    lunchCount: 20,
    cost: 35000,
  },
  {
    name: 'Monthly · 28 Meals',
    description: 'Monthly package (7 per week, lunch & dinner only)',
    lunchCount: 28,
    cost: 49000,
  },
  {
    name: 'Monthly · 40 Meals',
    description: 'Monthly package (10 per week, lunch & dinner only)',
    lunchCount: 40,
    cost: 62000,
  },
  {
    name: 'Monthly · 56 Meals',
    description: 'Monthly package (14 per week, lunch & dinner only)',
    lunchCount: 56,
    cost: 86000,
  },
  {
    name: 'Weekly Full Day · 5 Days',
    description: '3 meals per day for 5 days (breakfast, lunch, dinner)',
    breakfastCount: 5,
    lunchCount: 5,
    dinnerCount: 5,
    cost: 19500,
  },
  {
    name: 'Weekly Full Day · 7 Days',
    description: '3 meals per day for 7 days (breakfast, lunch, dinner)',
    breakfastCount: 7,
    lunchCount: 7,
    dinnerCount: 7,
    cost: 26000,
  },
  {
    name: '2 Weeks Full Day · 10 Days',
    description: '3 meals per day for 10 days (breakfast, lunch, dinner)',
    breakfastCount: 10,
    lunchCount: 10,
    dinnerCount: 10,
    cost: 37000,
  },
  {
    name: '2 Weeks Full Day · 14 Days',
    description: '3 meals per day for 14 days (breakfast, lunch, dinner)',
    breakfastCount: 14,
    lunchCount: 14,
    dinnerCount: 14,
    cost: 50000,
  },
  {
    name: 'Monthly Full Day · 20 Days',
    description: '3 meals per day for 20 days (breakfast, lunch, dinner)',
    breakfastCount: 20,
    lunchCount: 20,
    dinnerCount: 20,
    cost: 67000,
  },
  {
    name: 'Monthly Full Day · 28 Days',
    description: '3 meals per day for 28 days (breakfast, lunch, dinner)',
    breakfastCount: 28,
    lunchCount: 28,
    dinnerCount: 28,
    cost: 88000,
  },
];

function safeError(err) {
  const message = err instanceof Error ? err.message : String(err);
  return message.replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, 'mongodb://***');
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set');
  process.exit(1);
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const col = mongoose.connection.collection('packages');
  for (const pkg of packages) {
    const now = new Date();
    const result = await col.updateOne(
      { name: pkg.name },
      {
        $set: {
          name: pkg.name,
          description: pkg.description,
          breakfastCount: pkg.breakfastCount ?? 0,
          lunchCount: pkg.lunchCount,
          smoothieCount: 0,
          juiceShotCount: 0,
          dinnerCount: pkg.dinnerCount ?? 0,
          cost: pkg.cost,
          daysOption: 'any',
          specificDays: [],
          active: true,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
    const action = result.upsertedCount > 0 ? 'created' : 'updated';
    const breakfast = pkg.breakfastCount ?? 0;
    const dinner = pkg.dinnerCount ?? 0;
    console.log(
      `${action}: ${pkg.name} (${breakfast} breakfast, ${pkg.lunchCount} lunch, ${dinner} dinner, $${pkg.cost})`
    );
  }
  await mongoose.disconnect();
} catch (err) {
  console.error(safeError(err));
  process.exit(1);
}
