'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Checkbox,
    IconButton,
    Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { MealSlot } from '@/types/catalog';
import { MEAL_SLOT_LABELS } from '@/lib/meals/slots';
import { PackageDoc } from '@/app/meals/page'; // We'll export this or define it properly
import { getLocalCalendarDayKey } from '@/lib/calendarDayKey';

const SLOT_LABELS = MEAL_SLOT_LABELS;

export interface PackageSelectionProps {
    pkg: PackageDoc;
    weekDays: Date[];
    mealsByDaySlot: Record<string, Record<string, any[]>>;
    onCancel: () => void;
    onAddToCart: (pkg: PackageDoc, selections: Record<string, Record<string, any[]>>) => void;
}

export default function PackageSelection({
    pkg,
    weekDays,
    mealsByDaySlot,
    onCancel,
    onAddToCart,
}: PackageSelectionProps) {
    // Available days based on package constraints
    const availableDays = useMemo(() => {
        if (pkg.daysOption === 'any') return weekDays;
        return weekDays.filter((d) => pkg.specificDays.includes(d.getDay()));
    }, [pkg, weekDays]);

    const [stepIndex, setStepIndex] = useState(0);

    const emptySelectionsForDays = (days: Date[]) => {
        const init: Record<string, Record<string, any[]>> = {};
        days.forEach((day) => {
            const key = getLocalCalendarDayKey(day);
            init[key] = {
                [MealSlot.BREAKFAST]: [],
                [MealSlot.LUNCH]: [],
                [MealSlot.SMOOTHIES]: [],
                [MealSlot.JUICE_SHOT]: [],
                dinner: [],
            };
        });
        return init;
    };

    // selections map: local calendar YYYY-MM-DD -> slot -> meals (package limits are totals across all days below)
    const [selections, setSelections] = useState<Record<string, Record<string, any[]>>>(() =>
        emptySelectionsForDays(availableDays)
    );

    const availableDaysKey = useMemo(
        () => availableDays.map((d) => getLocalCalendarDayKey(d)).join('|'),
        [availableDays]
    );

    useEffect(() => {
        setSelections(emptySelectionsForDays(availableDays));
        setStepIndex(0);
    }, [pkg._id, availableDaysKey]);

    const getSlotLimit = (slot: string) => {
        switch (slot) {
            case MealSlot.BREAKFAST:
                return pkg.breakfastCount;
            case MealSlot.LUNCH:
                return pkg.lunchCount;
            case MealSlot.SMOOTHIES:
                return pkg.smoothieCount ?? pkg.dinnerCount ?? 0;
            case MealSlot.JUICE_SHOT:
                return pkg.juiceShotCount ?? 0;
            case 'dinner':
                return pkg.smoothieCount == null ? 0 : (pkg.dinnerCount ?? 0);
            default:
                return 0;
        }
    };

    /** Total selections for a slot across all available days (package-wide quota). */
    const countSlotAcrossPackage = (
        sel: Record<string, Record<string, any[]>>,
        slot: string
    ): number => {
        let n = 0;
        for (const day of availableDays) {
            const k = getLocalCalendarDayKey(day);
            n += (sel[k]?.[slot] || []).length;
        }
        return n;
    };

    const totalsBySlot = useMemo(
        () => ({
            [MealSlot.BREAKFAST]: countSlotAcrossPackage(selections, MealSlot.BREAKFAST),
            [MealSlot.LUNCH]: countSlotAcrossPackage(selections, MealSlot.LUNCH),
            [MealSlot.SMOOTHIES]: countSlotAcrossPackage(selections, MealSlot.SMOOTHIES),
            [MealSlot.JUICE_SHOT]: countSlotAcrossPackage(selections, MealSlot.JUICE_SHOT),
            dinner: countSlotAcrossPackage(selections, 'dinner'),
        }),
        [selections, availableDays]
    );

    const smoothieLimit = pkg.smoothieCount ?? pkg.dinnerCount ?? 0;
    const juiceShotLimit = pkg.juiceShotCount ?? 0;
    const dinnerLimit = pkg.smoothieCount == null ? 0 : (pkg.dinnerCount ?? 0);

    const wizardSteps = useMemo(() => {
        const order = [
            MealSlot.BREAKFAST,
            MealSlot.LUNCH,
            'dinner',
            MealSlot.SMOOTHIES,
            MealSlot.JUICE_SHOT,
        ];
        return order
            .filter((slot) => getSlotLimit(slot) > 0)
            .map((slot) => ({
                key: slot,
                label: slot === 'dinner' ? 'Dinner' : SLOT_LABELS[slot as MealSlot],
            }));
    }, [pkg]);

    const setMealQuantity = (dayKey: string, slot: string, meal: any, quantity: number) => {
        setSelections((prev) => {
            const mealName = meal.name;
            const limit = getSlotLimit(slot);
            let others = 0;
            const cleared: Record<string, Record<string, any[]>> = {};
            for (const [day, slots] of Object.entries(prev)) {
                const kept = (slots[slot] || []).filter((m) => m.name !== mealName);
                others += kept.length;
                cleared[day] = { ...slots, [slot]: kept };
            }
            const capped = Math.max(0, Math.min(quantity, Math.max(0, limit - others)));
            const daySlots = cleared[dayKey] || {};
            cleared[dayKey] = {
                ...daySlots,
                [slot]: [...(daySlots[slot] || []), ...Array.from({ length: capped }, () => meal)],
            };
            return cleared;
        });
    };

    const quantityOf = (slot: string, mealName: string) => {
        let n = 0;
        for (const day of Object.values(selections)) {
            n += (day[slot] || []).filter((m) => m.name === mealName).length;
        }
        return n;
    };

    const isSelectionComplete = useMemo(() => {
        return (
            (pkg.breakfastCount === 0 || totalsBySlot[MealSlot.BREAKFAST] === pkg.breakfastCount) &&
            (pkg.lunchCount === 0 || totalsBySlot[MealSlot.LUNCH] === pkg.lunchCount) &&
            (smoothieLimit === 0 || totalsBySlot[MealSlot.SMOOTHIES] === smoothieLimit) &&
            (juiceShotLimit === 0 || totalsBySlot[MealSlot.JUICE_SHOT] === juiceShotLimit) &&
            (dinnerLimit === 0 || totalsBySlot.dinner === dinnerLimit)
        );
    }, [totalsBySlot, pkg, smoothieLimit, juiceShotLimit, dinnerLimit]);

    if (availableDays.length === 0) return null;
    const step = wizardSteps[Math.min(stepIndex, Math.max(0, wizardSteps.length - 1))];
    const stepMeals = (() => {
        if (!step) return [];
        const sourceSlot = step.key === 'dinner' ? MealSlot.LUNCH : step.key;
        const seen = new Map<string, { meal: any; dayKey: string }>();
        for (const day of availableDays) {
            const dayKey = getLocalCalendarDayKey(day);
            for (const meal of mealsByDaySlot[dayKey]?.[sourceSlot] || []) {
                if (meal?.name && !seen.has(meal.name)) seen.set(meal.name, { meal, dayKey });
            }
        }
        return [...seen.values()];
    })();
    const stepLimit = step ? getSlotLimit(step.key) : 0;
    const stepUsed = step ? countSlotAcrossPackage(selections, step.key) : 0;

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={onCancel} sx={{ mr: 2 }}>
                    Back to Packages
                </Button>
                <Typography variant="h5" sx={{ flexGrow: 1 }}>
                    Configuring: {pkg.name}
                </Typography>
                <Typography variant="h6" color="primary">
                    ${(pkg.cost ?? 0).toFixed(2)}
                </Typography>
            </Box>

            <Card sx={{ mb: 4, bgcolor: 'background.default' }}>
                <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        What&apos;s included in this package
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        These counts are for the whole package (spread across the days you choose below), not per day.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        {pkg.breakfastCount > 0 && (
                            <Chip
                                label={`${pkg.breakfastCount} breakfast${pkg.breakfastCount === 1 ? '' : 's'} total`}
                                color="primary"
                                variant="outlined"
                            />
                        )}
                        {pkg.lunchCount > 0 && (
                            <Chip
                                label={`${pkg.lunchCount} lunch${pkg.lunchCount === 1 ? '' : 'es'} total`}
                                color="primary"
                                variant="outlined"
                            />
                        )}
                        {smoothieLimit > 0 && (
                            <Chip
                                label={`${smoothieLimit} smoothie${smoothieLimit === 1 ? '' : 's'} total`}
                                color="primary"
                                variant="outlined"
                            />
                        )}
                        {juiceShotLimit > 0 && (
                            <Chip
                                label={`${juiceShotLimit} juice shot${juiceShotLimit === 1 ? '' : 's'} total`}
                                color="primary"
                                variant="outlined"
                            />
                        )}
                        {dinnerLimit > 0 && (
                            <Chip
                                label={`${dinnerLimit} dinner${dinnerLimit === 1 ? '' : 's'} total`}
                                color="primary"
                                variant="outlined"
                            />
                        )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                        Progress:{' '}
                        {pkg.breakfastCount > 0 && (
                            <>
                                {SLOT_LABELS[MealSlot.BREAKFAST]} {totalsBySlot[MealSlot.BREAKFAST]}/
                                {pkg.breakfastCount}
                                {pkg.lunchCount > 0 || smoothieLimit > 0 || juiceShotLimit > 0 ? ' · ' : ''}
                            </>
                        )}
                        {pkg.lunchCount > 0 && (
                            <>
                                {SLOT_LABELS[MealSlot.LUNCH]} {totalsBySlot[MealSlot.LUNCH]}/{pkg.lunchCount}
                                {smoothieLimit > 0 || juiceShotLimit > 0 || dinnerLimit > 0 ? ' · ' : ''}
                            </>
                        )}
                        {smoothieLimit > 0 && (
                            <>
                                {SLOT_LABELS[MealSlot.SMOOTHIES]} {totalsBySlot[MealSlot.SMOOTHIES]}/{smoothieLimit}
                                {juiceShotLimit > 0 ? ' · ' : ''}
                            </>
                        )}
                        {juiceShotLimit > 0 && (
                            <>
                                {SLOT_LABELS[MealSlot.JUICE_SHOT]} {totalsBySlot[MealSlot.JUICE_SHOT]}/{juiceShotLimit}
                                {dinnerLimit > 0 ? ' · ' : ''}
                            </>
                        )}
                        {dinnerLimit > 0 && (
                            <>
                                Dinner {totalsBySlot.dinner}/{dinnerLimit}
                            </>
                        )}
                    </Typography>
                </CardContent>
            </Card>

            {!step ? (
                <Typography color="text.secondary">This package has no meals to choose.</Typography>
            ) : (
                <Box>
                    <Typography variant="body2" color="text.secondary">
                        Step {Math.min(stepIndex, wizardSteps.length - 1) + 1} of {wizardSteps.length}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 0.5 }}>
                        {step.label} ({stepUsed}/{stepLimit})
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Check a meal, then use + and − to choose how many.
                    </Typography>
                    {stepMeals.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            No {step.label.toLowerCase()} options are on the menu this week.
                        </Typography>
                    ) : (
                        stepMeals.map(({ meal, dayKey }) => {
                            const qty = quantityOf(step.key, meal.name);
                            const canIncrease = stepUsed < stepLimit;
                            return (
                                <Box
                                    key={meal.name}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        py: 0.5,
                                        borderBottom: 1,
                                        borderColor: 'divider',
                                    }}
                                >
                                    <Checkbox
                                        checked={qty > 0}
                                        disabled={qty === 0 && !canIncrease}
                                        onChange={(_, checked) =>
                                            setMealQuantity(dayKey, step.key, meal, checked ? 1 : 0)
                                        }
                                    />
                                    <Typography sx={{ flexGrow: 1 }}>{meal.name}</Typography>
                                    <IconButton
                                        aria-label={`Decrease ${meal.name}`}
                                        disabled={qty === 0}
                                        onClick={() => setMealQuantity(dayKey, step.key, meal, qty - 1)}
                                    >
                                        <RemoveIcon />
                                    </IconButton>
                                    <Typography sx={{ minWidth: 24, textAlign: 'center' }}>{qty}</Typography>
                                    <IconButton
                                        aria-label={`Increase ${meal.name}`}
                                        disabled={!canIncrease}
                                        onClick={() => setMealQuantity(dayKey, step.key, meal, qty + 1)}
                                    >
                                        <AddIcon />
                                    </IconButton>
                                </Box>
                            );
                        })
                    )}
                </Box>
            )}

            <Box sx={{ mt: 5, pt: 3, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="outlined" onClick={onCancel} size="large">
                    Cancel
                </Button>
                {stepIndex > 0 && (
                    <Button variant="outlined" size="large" onClick={() => setStepIndex((i) => i - 1)}>
                        Previous
                    </Button>
                )}
                {step && stepIndex < wizardSteps.length - 1 ? (
                    <Button
                        variant="contained"
                        size="large"
                        disabled={stepUsed !== stepLimit}
                        onClick={() => setStepIndex((i) => i + 1)}
                    >
                        Next: {wizardSteps[stepIndex + 1]?.label}
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        size="large"
                        disabled={!isSelectionComplete}
                        onClick={() => onAddToCart(pkg, selections)}
                    >
                        {isSelectionComplete ? 'Add Package to Cart' : 'Please Complete Selection'}
                    </Button>
                )}
            </Box>
        </Box>
    );
}
