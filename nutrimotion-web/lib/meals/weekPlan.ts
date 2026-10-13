/**
 * Weekly meal planning. A week runs Monday to Sunday; placing a saved meal in a week's slot
 * creates one MealPackage record per day, which ordering, packages and the cooking list read.
 */

import mongoose from 'mongoose';
import connectDB from '@/lib/db/connection';
import { MealCatalog, MealPackage } from '@/lib/db/models';
import type { IMealCatalog } from '@/lib/db/models';
import { MEAL_SLOT_ORDER, normalizeSlotKey } from '@/lib/meals/slots';
import { addDays, dayKeyOfDate, isWeekStart, jamaicaTodayKey, weekStartOf } from '@/lib/orders/orderWeek';
import { MealSlot } from '@/types/catalog';

const MAX_WEEKS = 10;

export class MealPlanError extends Error {}

export interface CatalogMeal {
  _id: string;
  name: string;
  description: string;
  price: number;
  slot: MealSlot;
  imageUrl?: string;
  soldIndividually: boolean;
  instagramLink?: string;
}

export interface PlacedMeal {
  name: string;
  price: number;
  imageUrl?: string;
  /** On only when every placed day has it on. */
  available: boolean;
  soldIndividually: boolean;
  /** How many of the week's 7 days have this meal. */
  days: number;
}

export interface WeekPlan {
  weekStart: string;
  weekEnd: string;
  slots: Record<MealSlot, PlacedMeal[]>;
}

function isMealSlot(value: unknown): value is MealSlot {
  return typeof value === 'string' && (Object.values(MealSlot) as string[]).includes(value);
}

function requireSlot(value: unknown): MealSlot {
  if (!isMealSlot(value)) throw new MealPlanError('Choose breakfast, lunch, smoothies or juice shots.');
  return value;
}

function requireWeek(value: unknown): string {
  if (!isWeekStart(value)) throw new MealPlanError('Weeks must start on a Monday (YYYY-MM-DD).');
  return value;
}

function weekRange(weekStart: string) {
  return {
    $gte: new Date(`${weekStart}T00:00:00.000Z`),
    $lt: new Date(`${addDays(weekStart, 7)}T00:00:00.000Z`),
  };
}

/** Older smoothie records were saved under the legacy `dinner` slot. */
function slotFilter(slot: MealSlot) {
  return slot === MealSlot.SMOOTHIES ? { $in: [MealSlot.SMOOTHIES, 'dinner'] } : slot;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toCatalogMeal(doc: IMealCatalog & { _id: unknown }): CatalogMeal {
  return {
    _id: String(doc._id),
    name: doc.name,
    description: doc.description ?? '',
    price: doc.price ?? 0,
    slot: doc.slot,
    imageUrl: doc.imageUrl || undefined,
    soldIndividually: doc.soldIndividually !== false,
    instagramLink: doc.instagramLink || undefined,
  };
}

/** Adds every meal name that only exists as daily records, using that meal's latest record. */
async function syncCatalogFromMeals(): Promise<void> {
  const [names, known] = await Promise.all([MealPackage.distinct('name'), MealCatalog.distinct('name')]);
  const knownSet = new Set(known.map((n: string) => n.trim()));
  const missing = (names as string[]).map((n) => n?.trim()).filter((n) => n && !knownSet.has(n));
  if (missing.length === 0) return;

  const docs = [];
  for (const name of new Set(missing)) {
    const latest = await MealPackage.findOne({ name }).sort({ scheduledDate: -1 }).lean();
    if (!latest) continue;
    const slot = normalizeSlotKey(latest.slot);
    docs.push({
      name,
      description: latest.description ?? '',
      price: latest.price ?? 0,
      slot: isMealSlot(slot) ? slot : MealSlot.LUNCH,
      imageUrl: latest.imageUrl || undefined,
      soldIndividually: latest.soldIndividually !== false,
      instagramLink: latest.instagramLink || undefined,
    });
  }
  if (docs.length > 0) {
    await MealCatalog.insertMany(docs, { ordered: false }).catch((error) => {
      if (error?.code !== 11000 && !error?.writeErrors) throw error;
    });
  }
}

export async function listCatalog(): Promise<CatalogMeal[]> {
  await connectDB();
  await syncCatalogFromMeals();
  const docs = await MealCatalog.find({}).lean();
  return docs
    .map(toCatalogMeal)
    .sort(
      (a, b) =>
        MEAL_SLOT_ORDER.indexOf(a.slot) - MEAL_SLOT_ORDER.indexOf(b.slot) || a.name.localeCompare(b.name)
    );
}

export interface CatalogInput {
  name?: unknown;
  description?: unknown;
  price?: unknown;
  slot?: unknown;
  soldIndividually?: unknown;
  instagramLink?: unknown;
}

function cleanCatalogInput(input: CatalogInput) {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) throw new MealPlanError('The meal needs a name.');
  const price = Number(input.price);
  if (input.price === '' || input.price == null || Number.isNaN(price) || price < 0) {
    throw new MealPlanError('Price must be zero or more.');
  }
  return {
    name,
    description: typeof input.description === 'string' ? input.description.trim() : '',
    price,
    slot: requireSlot(input.slot),
    soldIndividually: input.soldIndividually !== false,
    instagramLink: typeof input.instagramLink === 'string' ? input.instagramLink.trim() : '',
  };
}

async function assertNameFree(name: string, exceptId?: string) {
  const clash = await MealCatalog.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') }).select('_id').lean();
  if (clash && String(clash._id) !== exceptId) throw new MealPlanError(`A meal called "${name}" already exists.`);
}

export async function createCatalogMeal(input: CatalogInput): Promise<CatalogMeal> {
  await connectDB();
  const data = cleanCatalogInput(input);
  await assertNameFree(data.name);
  const doc = await MealCatalog.create({ ...data, instagramLink: data.instagramLink || undefined });
  return toCatalogMeal(doc.toObject());
}

/** Edits a saved meal and carries the changes onto its days from today onwards. */
export async function updateCatalogMeal(id: string, input: CatalogInput): Promise<CatalogMeal> {
  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(id)) throw new MealPlanError('Meal not found.');
  const existing = await MealCatalog.findById(id);
  if (!existing) throw new MealPlanError('Meal not found.');
  const data = cleanCatalogInput(input);
  if (data.name.toLowerCase() !== existing.name.toLowerCase()) await assertNameFree(data.name, id);

  const oldName = existing.name;
  existing.set({ ...data, instagramLink: data.instagramLink || undefined });
  await existing.save();

  await MealPackage.updateMany(
    { name: oldName, scheduledDate: { $gte: new Date(`${jamaicaTodayKey()}T00:00:00.000Z`) } },
    {
      $set: {
        name: data.name,
        description: data.description || data.name,
        price: data.price,
        ...(data.instagramLink ? { instagramLink: data.instagramLink } : {}),
      },
      ...(data.instagramLink ? {} : { $unset: { instagramLink: 1 } }),
    }
  );
  return toCatalogMeal(existing.toObject());
}

export async function deleteCatalogMeal(id: string): Promise<void> {
  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(id)) throw new MealPlanError('Meal not found.');
  const existing = await MealCatalog.findById(id).lean();
  if (!existing) throw new MealPlanError('Meal not found.');
  const upcoming = await MealPackage.exists({
    name: existing.name,
    scheduledDate: { $gte: new Date(`${weekStartOf(jamaicaTodayKey())}T00:00:00.000Z`) },
  });
  if (upcoming) {
    throw new MealPlanError(`${existing.name} is on this week's or a later week's menu. Remove it from those weeks first.`);
  }
  await MealCatalog.deleteOne({ _id: existing._id });
}

function emptySlots(): Record<MealSlot, PlacedMeal[]> {
  return {
    [MealSlot.BREAKFAST]: [],
    [MealSlot.LUNCH]: [],
    [MealSlot.SMOOTHIES]: [],
    [MealSlot.JUICE_SHOT]: [],
  };
}

export async function getWeekPlans(from: unknown, to: unknown): Promise<WeekPlan[]> {
  await connectDB();
  const first = requireWeek(from);
  const last = requireWeek(to ?? from);
  if (last < first) throw new MealPlanError('The last week must not be before the first.');
  const weekStarts: string[] = [];
  for (let w = first; w <= last; w = addDays(w, 7)) weekStarts.push(w);
  if (weekStarts.length > MAX_WEEKS) throw new MealPlanError(`Load at most ${MAX_WEEKS} weeks at a time.`);

  const docs = await MealPackage.find({
    scheduledDate: { $gte: new Date(`${first}T00:00:00.000Z`), $lt: new Date(`${addDays(last, 7)}T00:00:00.000Z`) },
  })
    .select('name slot price imageUrl available soldIndividually scheduledDate')
    .lean();

  type Acc = PlacedMeal & { dayKeys: Set<string> };
  const byWeek = new Map<string, Map<string, Acc>>();
  for (const doc of docs) {
    const day = dayKeyOfDate(doc.scheduledDate);
    const slot = normalizeSlotKey(doc.slot);
    if (!day || !isMealSlot(slot)) continue;
    const week = weekStartOf(day);
    const meals = byWeek.get(week) ?? new Map<string, Acc>();
    byWeek.set(week, meals);
    const key = `${slot}|${doc.name}`;
    const acc = meals.get(key);
    if (!acc) {
      meals.set(key, {
        name: doc.name,
        price: doc.price ?? 0,
        imageUrl: doc.imageUrl || undefined,
        available: doc.available !== false,
        soldIndividually: doc.soldIndividually !== false,
        days: 0,
        dayKeys: new Set([day]),
      });
    } else {
      acc.dayKeys.add(day);
      if (doc.available === false) acc.available = false;
      if (doc.soldIndividually === false) acc.soldIndividually = false;
      if (!acc.imageUrl && doc.imageUrl) acc.imageUrl = doc.imageUrl;
    }
  }

  return weekStarts.map((weekStart) => {
    const slots = emptySlots();
    for (const [key, acc] of byWeek.get(weekStart) ?? []) {
      const slot = key.slice(0, key.indexOf('|')) as MealSlot;
      const { dayKeys, ...meal } = acc;
      slots[slot].push({ ...meal, days: dayKeys.size });
    }
    for (const slot of MEAL_SLOT_ORDER) slots[slot].sort((a, b) => a.name.localeCompare(b.name));
    return { weekStart, weekEnd: addDays(weekStart, 6), slots };
  });
}

interface Flags {
  available: boolean;
  soldIndividually: boolean;
}

/** Creates the missing daily records of a meal for a week; returns how many days were added. */
async function fillWeek(weekStart: string, slot: MealSlot, meal: IMealCatalog, flags: Flags): Promise<number> {
  const existing = await MealPackage.find({ name: meal.name, slot: slotFilter(slot), scheduledDate: weekRange(weekStart) })
    .select('scheduledDate')
    .lean();
  const have = new Set(existing.map((d) => dayKeyOfDate(d.scheduledDate)));
  const docs = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    if (have.has(day)) continue;
    docs.push({
      name: meal.name,
      description: meal.description || meal.name,
      price: meal.price ?? 0,
      slot,
      scheduledDate: new Date(`${day}T00:00:00.000Z`),
      available: flags.available,
      soldIndividually: flags.soldIndividually,
      ...(meal.imageUrl ? { imageUrl: meal.imageUrl } : {}),
      ...(meal.instagramLink ? { instagramLink: meal.instagramLink } : {}),
    });
  }
  if (docs.length > 0) await MealPackage.insertMany(docs);
  return docs.length;
}

async function weekFlags(weekStart: string, slot: MealSlot, name: string): Promise<Flags | null> {
  const docs = await MealPackage.find({ name, slot: slotFilter(slot), scheduledDate: weekRange(weekStart) })
    .select('available soldIndividually')
    .lean();
  if (docs.length === 0) return null;
  return {
    available: docs.every((d) => d.available !== false),
    soldIndividually: docs.every((d) => d.soldIndividually !== false),
  };
}

async function catalogMeal(name: unknown): Promise<IMealCatalog> {
  const clean = typeof name === 'string' ? name.trim() : '';
  if (!clean) throw new MealPlanError('Choose a meal.');
  const meal = await MealCatalog.findOne({ name: clean }).lean();
  if (!meal) throw new MealPlanError(`${clean} is not in the meal list.`);
  return meal;
}

export interface PlaceInput {
  weekStart?: unknown;
  slot?: unknown;
  name?: unknown;
  /** Set when moving a meal that is already placed. */
  from?: { weekStart?: unknown; slot?: unknown } | null;
}

export async function placeMeal(input: PlaceInput): Promise<{ added: number }> {
  await connectDB();
  const weekStart = requireWeek(input.weekStart);
  const slot = requireSlot(input.slot);
  const meal = await catalogMeal(input.name);

  if (input.from) {
    const fromWeek = requireWeek(input.from.weekStart);
    const fromSlot = requireSlot(input.from.slot);
    if (fromWeek === weekStart && fromSlot === slot) return { added: 0 };
    const flags = (await weekFlags(fromWeek, fromSlot, meal.name)) ?? {
      available: true,
      soldIndividually: meal.soldIndividually !== false,
    };
    const added = await fillWeek(weekStart, slot, meal, flags);
    await MealPackage.deleteMany({ name: meal.name, slot: slotFilter(fromSlot), scheduledDate: weekRange(fromWeek) });
    return { added };
  }

  const flags = (await weekFlags(weekStart, slot, meal.name)) ?? {
    available: true,
    soldIndividually: meal.soldIndividually !== false,
  };
  return { added: await fillWeek(weekStart, slot, meal, flags) };
}

export async function removeMeal(input: PlaceInput): Promise<{ removed: number }> {
  await connectDB();
  const weekStart = requireWeek(input.weekStart);
  const slot = requireSlot(input.slot);
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) throw new MealPlanError('Choose a meal.');
  const result = await MealPackage.deleteMany({ name, slot: slotFilter(slot), scheduledDate: weekRange(weekStart) });
  return { removed: result.deletedCount ?? 0 };
}

export async function setWeekMealFlags(
  input: PlaceInput & { available?: unknown; soldIndividually?: unknown }
): Promise<{ updated: number }> {
  await connectDB();
  const weekStart = requireWeek(input.weekStart);
  const slot = requireSlot(input.slot);
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) throw new MealPlanError('Choose a meal.');
  const set: Partial<Flags> = {};
  if (typeof input.available === 'boolean') set.available = input.available;
  if (typeof input.soldIndividually === 'boolean') set.soldIndividually = input.soldIndividually;
  if (Object.keys(set).length === 0) throw new MealPlanError('Nothing to change.');
  const result = await MealPackage.updateMany(
    { name, slot: slotFilter(slot), scheduledDate: weekRange(weekStart) },
    { $set: set }
  );
  return { updated: result.modifiedCount ?? 0 };
}

/** Copies every meal of one week into another; meals already in the target week are kept. */
export async function copyWeek(from: unknown, to: unknown): Promise<{ meals: number; added: number }> {
  await connectDB();
  const source = requireWeek(from);
  const target = requireWeek(to);
  if (source === target) throw new MealPlanError('Choose a different week to copy into.');

  const [plan] = await getWeekPlans(source, source);
  await syncCatalogFromMeals();
  let meals = 0;
  let added = 0;
  for (const slot of MEAL_SLOT_ORDER) {
    for (const placed of plan.slots[slot]) {
      const meal = await MealCatalog.findOne({ name: placed.name }).lean();
      if (!meal) continue;
      meals++;
      added += await fillWeek(target, slot, meal, {
        available: placed.available,
        soldIndividually: placed.soldIndividually,
      });
    }
  }
  if (meals === 0) throw new MealPlanError('There are no meals in that week to copy.');
  return { meals, added };
}
