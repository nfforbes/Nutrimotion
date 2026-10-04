/**
 * Who may open recipes and videos: active subscribers, admins, free items, and this week's picks.
 */

import { ContentAccessSetting, Subscription, User } from '@/lib/db/models';
import type { ContentLibrary, IContentAccessSetting } from '@/lib/db/models';

/** Sunday (UTC) of the current week as YYYY-MM-DD. */
export function currentWeekKey(now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().slice(0, 10);
}

export async function getAccessSetting(library: ContentLibrary): Promise<IContentAccessSetting> {
  const existing = await ContentAccessSetting.findById(library).lean<IContentAccessSetting>();
  if (existing) return existing;
  const created = await ContentAccessSetting.create({ _id: library });
  return created.toObject() as IContentAccessSetting;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * This week's picks. Random picks are generated once per week and stored so they
 * stay the same for everyone until the next week starts.
 */
export async function getSpotlightIds(
  library: ContentLibrary,
  allIds: string[],
  setting?: IContentAccessSetting
): Promise<string[]> {
  const s = setting ?? (await getAccessSetting(library));
  const valid = new Set(allIds);

  if (s.spotlightMode === 'preferred') {
    return (s.preferredIds ?? []).filter((id) => valid.has(id));
  }

  const week = currentWeekKey();
  const count = Math.max(0, s.randomCount ?? 0);
  const stored = (s.randomIds ?? []).filter((id) => valid.has(id));
  if (s.randomWeekKey === week && stored.length === Math.min(count, allIds.length)) {
    return stored;
  }

  const picked = shuffle(allIds).slice(0, count);
  await ContentAccessSetting.updateOne(
    { _id: library },
    { $set: { randomWeekKey: week, randomIds: picked } },
    { upsert: true }
  );
  return picked;
}

export async function hasActiveSubscription(auth0Sub: string, type: ContentLibrary): Promise<boolean> {
  const user = await User.findOne({ auth0Sub }).select('_id');
  if (!user) return false;
  const active = await Subscription.exists({
    userId: user._id,
    type,
    status: 'active',
    endDate: { $gt: new Date() },
  });
  return Boolean(active);
}
