export type PackageSpan = 'monthly' | 'weeks' | 'days';
export type PackageSpanFilter = PackageSpan | 'all';
export type PackageSort = 'price-asc' | 'price-desc' | 'meals-asc' | 'meals-desc' | 'name';

export const PACKAGE_SPAN_ORDER: PackageSpan[] = ['monthly', 'weeks', 'days'];

export const PACKAGE_SPAN_LABELS: Record<PackageSpan, string> = {
  monthly: 'Monthly packages',
  weeks: 'Weeks packages',
  days: 'Days packages',
};

export interface PackageCounts {
  name: string;
  description?: string;
  breakfastCount?: number;
  lunchCount?: number;
  smoothieCount?: number | null;
  juiceShotCount?: number;
  dinnerCount?: number;
  cost?: number;
}

export function packageMealTotal(pkg: PackageCounts): number {
  const breakfast = pkg.breakfastCount ?? 0;
  const lunch = pkg.lunchCount ?? 0;
  const juice = pkg.juiceShotCount ?? 0;
  const dinner = pkg.dinnerCount ?? 0;
  if (pkg.smoothieCount == null) {
    return breakfast + lunch + dinner + juice;
  }
  return breakfast + lunch + dinner + pkg.smoothieCount + juice;
}

/** Full-day plans are days. Everything else is monthly or weeks from its name. */
export function packageSpan(pkg: PackageCounts): PackageSpan {
  const text = `${pkg.name} ${pkg.description ?? ''}`.toLowerCase();
  if (text.includes('full day') || text.includes('per day')) return 'days';
  if (text.includes('month')) return 'monthly';
  if (text.includes('week')) return 'weeks';
  if ((pkg.breakfastCount ?? 0) > 0 && (pkg.dinnerCount ?? 0) > 0) return 'days';
  return 'weeks';
}

export function sortPackages<T extends PackageCounts>(packages: T[], sort: PackageSort): T[] {
  const copy = [...packages];
  copy.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'price-desc') return (b.cost ?? 0) - (a.cost ?? 0) || a.name.localeCompare(b.name);
    if (sort === 'meals-asc') return packageMealTotal(a) - packageMealTotal(b) || a.name.localeCompare(b.name);
    if (sort === 'meals-desc') return packageMealTotal(b) - packageMealTotal(a) || a.name.localeCompare(b.name);
    return (a.cost ?? 0) - (b.cost ?? 0) || a.name.localeCompare(b.name);
  });
  return copy;
}

export function groupPackages<T extends PackageCounts>(
  packages: T[],
  span: PackageSpanFilter,
  sort: PackageSort
): { span: PackageSpan; label: string; packages: T[] }[] {
  const spans = span === 'all' ? PACKAGE_SPAN_ORDER : [span];
  return spans
    .map((key) => ({
      span: key,
      label: PACKAGE_SPAN_LABELS[key],
      packages: sortPackages(
        packages.filter((pkg) => packageSpan(pkg) === key),
        sort
      ),
    }))
    .filter((group) => group.packages.length > 0);
}
