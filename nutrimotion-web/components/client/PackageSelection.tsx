'use client';

import { useState, useMemo } from 'react';
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
import { PackageDoc } from '@/app/meals/page'; // We'll export this or define it properly

const SLOT_LABELS: Record<string, string> = {
    [MealSlot.BREAKFAST]: 'Breakfast',
    [MealSlot.LUNCH]: 'Lunch',
    [MealSlot.DINNER]: 'Dinner',
};
const SLOT_ORDER = [MealSlot.BREAKFAST, MealSlot.LUNCH, MealSlot.DINNER];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_LABELS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

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

    // selections map: isoDate -> slot -> array of selected meals
    const [selections, setSelections] = useState<Record<string, Record<string, any[]>>>(() => {
        const init: Record<string, Record<string, any[]>> = {};
        availableDays.forEach((day) => {
            const key = isoDate(day);
            init[key] = {
                [MealSlot.BREAKFAST]: [],
                [MealSlot.LUNCH]: [],
                [MealSlot.DINNER]: [],
            };
        });
        return init;
    });

    const getSlotLimit = (slot: string) => {
        switch (slot) {
            case MealSlot.BREAKFAST:
                return pkg.breakfastCount;
            case MealSlot.LUNCH:
                return pkg.lunchCount;
            case MealSlot.DINNER:
                return pkg.dinnerCount;
            default:
                return 0;
        }
    };

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
                if (currentSlotSelections.length < limit) {
                    newSlotSelections.push(meal);
                } else {
                    // Optional: Show a snackbar or alert that the limit is reached
                    return prev;
                }
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
        return availableDays.every((day) => {
            const dayKey = isoDate(day);
            const daySels = selections[dayKey] || {};
            return (
                (daySels[MealSlot.BREAKFAST] || []).length === pkg.breakfastCount &&
                (daySels[MealSlot.LUNCH] || []).length === pkg.lunchCount &&
                (daySels[MealSlot.DINNER] || []).length === pkg.dinnerCount
            );
        });
    }, [availableDays, selections, pkg]);

    const currentDay = availableDays[activeTab];
    if (!currentDay) return null;
    const currentDayKey = isoDate(currentDay);
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
                        Package Requirements per Day
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {pkg.breakfastCount > 0 && (
                            <Chip label={`${pkg.breakfastCount} Breakfast(s)`} color="primary" variant="outlined" />
                        )}
                        {pkg.lunchCount > 0 && (
                            <Chip label={`${pkg.lunchCount} Lunch(es)`} color="primary" variant="outlined" />
                        )}
                        {pkg.dinnerCount > 0 && (
                            <Chip label={`${pkg.dinnerCount} Dinner(s)`} color="primary" variant="outlined" />
                        )}
                    </Box>
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
                    const dayKey = isoDate(day);
                    const daySels = selections[dayKey] || {};
                    const isDayComplete =
                        (daySels[MealSlot.BREAKFAST] || []).length === pkg.breakfastCount &&
                        (daySels[MealSlot.LUNCH] || []).length === pkg.lunchCount &&
                        (daySels[MealSlot.DINNER] || []).length === pkg.dinnerCount;

                    return (
                        <Tab
                            key={i}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <span>{`${DAY_NAMES[day.getDay()]} ${formatDate(day)}`}</span>
                                    {isDayComplete && <CheckCircleOutlineIcon color="success" fontSize="small" />}
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
                    const remaining = limit - currentSlotSelections.length;

                    return (
                        <Grid size={{ xs: 12 }} key={slot}>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2, gap: 2 }}>
                                <Typography variant="h6" color="primary">
                                    {SLOT_LABELS[slot]}
                                </Typography>
                                <Typography variant="body2" color={remaining === 0 ? 'success.main' : 'text.secondary'}>
                                    {remaining === 0
                                        ? `Selected ${limit}/${limit} — Done`
                                        : `Please select ${remaining} more`}
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
                                        const disabled = !isSelected && remaining === 0;

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
