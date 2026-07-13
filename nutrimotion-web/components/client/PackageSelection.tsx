'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Tabs,
    Tab,
    CardMedia,
    CardActions,
    Chip,
    Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { MealSlot } from '@/types/catalog';
import { MEAL_SLOT_LABELS, MEAL_SLOT_ORDER } from '@/lib/meals/slots';
import { PackageDoc } from '@/app/meals/page'; // We'll export this or define it properly
import { getLocalCalendarDayKey } from '@/lib/calendarDayKey';

const SLOT_LABELS = MEAL_SLOT_LABELS;
const SLOT_ORDER = MEAL_SLOT_ORDER;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDate(d: Date): string {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

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

    const [activeTab, setActiveTab] = useState(0);

    const emptySelectionsForDays = (days: Date[]) => {
        const init: Record<string, Record<string, any[]>> = {};
        days.forEach((day) => {
            const key = getLocalCalendarDayKey(day);
            init[key] = {
                [MealSlot.BREAKFAST]: [],
                [MealSlot.LUNCH]: [],
                [MealSlot.SMOOTHIES]: [],
                [MealSlot.JUICE_SHOT]: [],
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
        setActiveTab(0);
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
        }),
        [selections, availableDays]
    );

    const smoothieLimit = pkg.smoothieCount ?? pkg.dinnerCount ?? 0;
    const juiceShotLimit = pkg.juiceShotCount ?? 0;

    const handleToggleMeal = (dayKey: string, slot: string, meal: any) => {
        setSelections((prev) => {
            const currentSlotSelections = prev[dayKey]?.[slot] || [];
            const isSelected = currentSlotSelections.some((m) => m.id === meal.id || m._id === meal._id);

            let newSlotSelections = [...currentSlotSelections];
            if (isSelected) {
                newSlotSelections = currentSlotSelections.filter(
                    (m) => (m.id || m._id) !== (meal.id || meal._id)
                );
            } else {
                const limit = getSlotLimit(slot);
                const totalForSlot = countSlotAcrossPackage(prev, slot);
                if (totalForSlot >= limit) {
                    return prev;
                }
                newSlotSelections.push(meal);
            }

            return {
                ...prev,
                [dayKey]: {
                    ...prev[dayKey],
                    [slot]: newSlotSelections,
                },
            };
        });
    };

    const isSelectionComplete = useMemo(() => {
        return (
            (pkg.breakfastCount === 0 || totalsBySlot[MealSlot.BREAKFAST] === pkg.breakfastCount) &&
            (pkg.lunchCount === 0 || totalsBySlot[MealSlot.LUNCH] === pkg.lunchCount) &&
            (smoothieLimit === 0 || totalsBySlot[MealSlot.SMOOTHIES] === smoothieLimit) &&
            (juiceShotLimit === 0 || totalsBySlot[MealSlot.JUICE_SHOT] === juiceShotLimit)
        );
    }, [totalsBySlot, pkg, smoothieLimit, juiceShotLimit]);

    const currentDay = availableDays[activeTab];
    if (!currentDay) return null;
    const currentDayKey = getLocalCalendarDayKey(currentDay);
    const currentDayMeals = mealsByDaySlot[currentDayKey] || {};

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
                                {smoothieLimit > 0 || juiceShotLimit > 0 ? ' · ' : ''}
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
                            </>
                        )}
                    </Typography>
                </CardContent>
            </Card>

            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
                {availableDays.map((day, i) => {
                    const dayKey = getLocalCalendarDayKey(day);
                    const daySels = selections[dayKey] || {};
                    const hasAnySelection = SLOT_ORDER.some(
                        (slot) => (daySels[slot] || []).length > 0
                    );

                    return (
                        <Tab
                            key={i}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <span>{`${DAY_NAMES[day.getDay()]} ${formatDate(day)}`}</span>
                                    {hasAnySelection && <CheckCircleOutlineIcon color="action" fontSize="small" />}
                                </Box>
                            }
                        />
                    );
                })}
            </Tabs>

            <Grid container spacing={4}>
                {SLOT_ORDER.map((slot) => {
                    const limit = getSlotLimit(slot);
                    if (limit === 0) return null; // Slot not included in package

                    const slotMeals = currentDayMeals[slot] || [];
                    const currentSlotSelections = selections[currentDayKey]?.[slot] || [];
                    const totalForSlot = totalsBySlot[slot as MealSlot] ?? 0;
                    const remainingGlobal = limit - totalForSlot;

                    return (
                        <Grid size={{ xs: 12 }} key={slot}>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                                <Typography variant="h6" color="primary">
                                    {SLOT_LABELS[slot]}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color={remainingGlobal === 0 ? 'success.main' : 'text.secondary'}
                                >
                                    {remainingGlobal === 0
                                        ? `All ${limit} selected for this package`
                                        : `${totalForSlot}/${limit} selected — ${remainingGlobal} left to assign`}
                                </Typography>
                            </Box>

                            {slotMeals.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                    No {SLOT_LABELS[slot].toLowerCase()} options available for this day.
                                </Typography>
                            ) : (
                                <Grid container spacing={2}>
                                    {slotMeals.map((meal: any) => {
                                        const isSelected = currentSlotSelections.some(
                                            (m) => (m.id || m._id) === (meal.id || meal._id)
                                        );
                                        const disabled = !isSelected && remainingGlobal === 0;

                                        return (
                                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={meal.id || meal._id}>
                                                <Card
                                                    sx={{
                                                        height: '100%',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        cursor: disabled ? 'not-allowed' : 'pointer',
                                                        opacity: disabled ? 0.6 : 1,
                                                        border: isSelected ? 2 : 1,
                                                        borderColor: isSelected ? 'primary.main' : 'divider',
                                                        position: 'relative',
                                                        transition: 'all 0.2s ease-in-out',
                                                        '&:hover': {
                                                            transform: disabled ? 'none' : 'translateY(-2px)',
                                                            boxShadow: disabled ? 1 : 4,
                                                        },
                                                    }}
                                                    onClick={() => {
                                                        if (!disabled || isSelected) {
                                                            handleToggleMeal(currentDayKey, slot, meal);
                                                        }
                                                    }}
                                                >
                                                    {isSelected && (
                                                        <Box
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 8,
                                                                right: 8,
                                                                bgcolor: 'primary.main',
                                                                color: 'primary.contrastText',
                                                                borderRadius: '50%',
                                                                p: 0.5,
                                                                display: 'flex',
                                                                zIndex: 1,
                                                            }}
                                                        >
                                                            <CheckCircleOutlineIcon fontSize="small" />
                                                        </Box>
                                                    )}
                                                    <CardMedia
                                                        component="img"
                                                        height="140"
                                                        image={meal.imageUrl || '/placeholder-meal.jpg'}
                                                        alt={meal.name}
                                                    />
                                                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, lineHeight: 1.2 }}>
                                                            {meal.name}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                            }}
                                                        >
                                                            {meal.description}
                                                        </Typography>
                                                    </CardContent>
                                                    <Divider />
                                                    <CardActions sx={{ p: 1, justifyContent: 'center' }}>
                                                        <Button
                                                            size="small"
                                                            variant={isSelected ? 'contained' : 'outlined'}
                                                            color={isSelected ? 'success' : 'primary'}
                                                            fullWidth
                                                            disabled={disabled && !isSelected}
                                                        >
                                                            {isSelected ? 'Selected' : 'Select'}
                                                        </Button>
                                                    </CardActions>
                                                </Card>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            )}
                        </Grid>
                    );
                })}
            </Grid>

            <Box sx={{ mt: 5, pt: 3, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="outlined" onClick={onCancel} size="large">
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    size="large"
                    disabled={!isSelectionComplete}
                    onClick={() => onAddToCart(pkg, selections)}
                >
                    {isSelectionComplete ? 'Add Package to Cart' : 'Please Complete Selection'}
                </Button>
            </Box>
        </Box>
    );
}
