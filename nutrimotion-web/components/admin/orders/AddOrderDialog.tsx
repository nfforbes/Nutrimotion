'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import PackageSelection from '@/components/client/PackageSelection';
import type { PackageDoc } from '@/app/meals/page';
import { dayKeyToLocalDate } from '@/lib/calendarDayKey';
import { MEAL_SLOT_ORDER, normalizeSlotKey, slotLabel } from '@/lib/meals/slots';
import { dayKeyOfDate, formatDayKey } from '@/lib/orders/orderWeek';
import { MealSlot } from '@/types/catalog';

interface ClientOption {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: { street?: string; parish?: string } | null;
}

interface WeekOption {
  weekStart: string;
  weekEnd: string;
  days: string[];
  label: string;
  clientCutoffPassed: boolean;
}

interface MealOption {
  _id: string;
  id: string;
  name: string;
  slot: string;
  price: number;
  scheduledDate: string;
  soldIndividually?: boolean;
}

interface OrderOptions {
  clientWeek: { weekStart: string };
  weeks: WeekOption[];
  clients: ClientOption[];
  packages: PackageDoc[];
  meals: MealOption[];
}

type PackageDetails = Record<string, Record<string, string[] | undefined>>;

interface Line {
  key: string;
  itemType: 'package' | 'meal';
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  detail: string;
  packageDetails?: PackageDetails;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function weekLabel(week: WeekOption, options: OrderOptions): string {
  const tags: string[] = [];
  if (week.weekStart === options.weeks[0]?.weekStart) tags.push('this week');
  if (week.weekStart === options.clientWeek.weekStart) tags.push('clients are ordering for this week');
  else if (week.clientCutoffPassed) tags.push('client ordering closed');
  return tags.length ? `${week.label} (${tags.join(', ')})` : week.label;
}

function packageSummary(details: PackageDetails): string {
  const days = Object.entries(details).filter(([, slots]) =>
    Object.values(slots).some((names) => (names?.length ?? 0) > 0)
  );
  const meals = days.reduce(
    (sum, [, slots]) => sum + Object.values(slots).reduce((n, names) => n + (names?.length ?? 0), 0),
    0
  );
  return `${meals} meal${meals === 1 ? '' : 's'} over ${days.length} day${days.length === 1 ? '' : 's'}`;
}

export default function AddOrderDialog({ open, onClose, onCreated }: Props) {
  const [options, setOptions] = useState<OrderOptions | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [client, setClient] = useState<ClientOption | null>(null);
  const [weekStart, setWeekStart] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [configuring, setConfiguring] = useState<PackageDoc | null>(null);
  const [packageToAdd, setPackageToAdd] = useState('');
  const [mealToAdd, setMealToAdd] = useState<MealOption | null>(null);
  const [street, setStreet] = useState('');
  const [parish, setParish] = useState('');
  const [instructions, setInstructions] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setOptions(null);
    setLoadError(null);
    setClient(null);
    setLines([]);
    setConfiguring(null);
    setPackageToAdd('');
    setMealToAdd(null);
    setStreet('');
    setParish('');
    setInstructions('');
    setNote('');
    setSaveError(null);
    axios
      .get<OrderOptions>('/api/admin/orders/options')
      .then((res) => {
        setOptions(res.data);
        setWeekStart(res.data.clientWeek.weekStart);
      })
      .catch((err) => setLoadError(err.response?.data?.error || 'Could not load clients and menus.'));
  }, [open]);

  const week = options?.weeks.find((w) => w.weekStart === weekStart) ?? null;

  const weekMeals = useMemo(
    () =>
      (options?.meals ?? []).filter((m) => {
        const day = dayKeyOfDate(m.scheduledDate);
        return !!day && !!week && week.days.includes(day);
      }),
    [options, week]
  );

  const weekDays = useMemo(() => (week ? week.days.map(dayKeyToLocalDate) : []), [week]);

  const mealsByDaySlot = useMemo(() => {
    const map: Record<string, Record<string, any[]>> = {};
    for (const key of week?.days ?? []) {
      map[key] = {};
      MEAL_SLOT_ORDER.forEach((slot) => (map[key][slot] = []));
    }
    for (const meal of weekMeals) {
      const key = dayKeyOfDate(meal.scheduledDate);
      const slot = normalizeSlotKey(meal.slot);
      if (key && map[key]?.[slot]) map[key][slot].push(meal);
    }
    return map;
  }, [week, weekMeals]);

  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  const chooseClient = (value: ClientOption | null) => {
    setClient(value);
    setStreet(value?.address?.street ?? '');
    setParish(value?.address?.parish ?? '');
  };

  const chooseWeek = (value: string) => {
    if (value === weekStart) return;
    if (lines.length > 0 && !window.confirm('Changing the week removes the items already added. Continue?')) return;
    setWeekStart(value);
    setLines([]);
    setMealToAdd(null);
  };

  const addPackage = (pkg: PackageDoc, selections: Record<string, Record<string, any[]>>) => {
    const packageDetails: PackageDetails = {};
    for (const [day, daySels] of Object.entries(selections)) {
      packageDetails[day] = {
        breakfast: daySels[MealSlot.BREAKFAST]?.map((m) => m.name),
        lunch: daySels[MealSlot.LUNCH]?.map((m) => m.name),
        smoothies: daySels[MealSlot.SMOOTHIES]?.map((m) => m.name),
        juice_shot: daySels[MealSlot.JUICE_SHOT]?.map((m) => m.name),
        dinner: daySels.dinner?.map((m) => m.name),
      };
    }
    setLines((prev) => [
      ...prev,
      {
        key: `${pkg._id}-${Date.now()}`,
        itemType: 'package',
        itemId: pkg._id,
        name: pkg.name,
        price: pkg.cost ?? 0,
        quantity: 1,
        detail: packageSummary(packageDetails),
        packageDetails,
      },
    ]);
    setConfiguring(null);
    setPackageToAdd('');
  };

  const addMeal = () => {
    if (!mealToAdd) return;
    const meal = mealToAdd;
    setLines((prev) => {
      const existing = prev.find((l) => l.itemType === 'meal' && l.itemId === meal._id);
      if (existing) {
        return prev.map((l) => (l === existing ? { ...l, quantity: l.quantity + 1 } : l));
      }
      const day = dayKeyOfDate(meal.scheduledDate);
      return [
        ...prev,
        {
          key: meal._id,
          itemType: 'meal',
          itemId: meal._id,
          name: meal.name,
          price: meal.price ?? 0,
          quantity: 1,
          detail: `${day ? formatDayKey(day) : ''} · ${slotLabel(meal.slot)}`,
        },
      ];
    });
    setMealToAdd(null);
  };

  const setQuantity = (key: string, quantity: number) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, quantity) } : l)));

  const submit = async () => {
    if (!client || !week || lines.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      await axios.post('/api/admin/orders', {
        userId: client._id,
        weekStart: week.weekStart,
        items: lines.map((l) => ({
          itemType: l.itemType,
          itemId: l.itemId,
          quantity: l.quantity,
          packageDetails: l.packageDetails,
        })),
        deliveryAddress: { street, parish },
        deliveryInstructions: instructions,
        note,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setSaveError(err.response?.data?.error || 'Could not add the order.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{configuring ? `Add ${configuring.name}` : 'Add order for a client'}</DialogTitle>
      <DialogContent dividers>
        {loadError ? (
          <Alert severity="error">{loadError}</Alert>
        ) : !options ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : configuring && week ? (
          <PackageSelection
            pkg={configuring}
            weekDays={weekDays}
            mealsByDaySlot={mealsByDaySlot}
            onCancel={() => setConfiguring(null)}
            onAddToCart={addPackage}
          />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Autocomplete
              options={options.clients}
              value={client}
              onChange={(_, value) => chooseClient(value)}
              getOptionLabel={(c) => (c.email ? `${c.name || 'No name'} (${c.email})` : c.name)}
              isOptionEqualToValue={(a, b) => a._id === b._id}
              renderInput={(params) => <TextField {...params} label="Client" required />}
            />

            <FormControl fullWidth required>
              <InputLabel>Week</InputLabel>
              <Select value={weekStart} label="Week" onChange={(e) => chooseWeek(e.target.value)}>
                {options.weeks.map((w) => (
                  <MenuItem key={w.weekStart} value={w.weekStart}>
                    {weekLabel(w, options)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {week && weekMeals.length === 0 && (
              <Alert severity="warning">
                No meals are on the menu for {week.label}. Schedule meals for this week before adding an order.
              </Alert>
            )}

            <Divider />
            <Typography variant="subtitle1" fontWeight={600}>
              Items
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 260, flex: 1 }} size="small" disabled={weekMeals.length === 0}>
                <InputLabel>Package</InputLabel>
                <Select value={packageToAdd} label="Package" onChange={(e) => setPackageToAdd(e.target.value)}>
                  {options.packages.map((p) => (
                    <MenuItem key={p._id} value={p._id}>
                      {p.name} · ${(p.cost ?? 0).toFixed(2)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                disabled={!packageToAdd || weekMeals.length === 0}
                onClick={() => setConfiguring(options.packages.find((p) => p._id === packageToAdd) ?? null)}
              >
                Choose meals
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Autocomplete
                sx={{ minWidth: 260, flex: 1 }}
                size="small"
                options={weekMeals}
                value={mealToAdd}
                onChange={(_, value) => setMealToAdd(value)}
                disabled={weekMeals.length === 0}
                groupBy={(m) => {
                  const day = dayKeyOfDate(m.scheduledDate);
                  return day ? formatDayKey(day) : '';
                }}
                getOptionLabel={(m) => `${slotLabel(m.slot)} · ${m.name} · $${m.price}`}
                isOptionEqualToValue={(a, b) => a._id === b._id}
                renderInput={(params) => <TextField {...params} label="Individual meal" />}
              />
              <Button variant="outlined" disabled={!mealToAdd} onClick={addMeal}>
                Add meal
              </Button>
            </Box>

            {lines.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No items yet.
              </Typography>
            ) : (
              <Box>
                {lines.map((line) => (
                  <Box
                    key={line.key}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, borderBottom: 1, borderColor: 'divider' }}
                  >
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography fontWeight={600}>{line.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {line.detail}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      aria-label="Decrease"
                      disabled={line.quantity <= 1}
                      onClick={() => setQuantity(line.key, line.quantity - 1)}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography sx={{ minWidth: 20, textAlign: 'center' }}>{line.quantity}</Typography>
                    <IconButton size="small" aria-label="Increase" onClick={() => setQuantity(line.key, line.quantity + 1)}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                    <Typography sx={{ minWidth: 80, textAlign: 'right' }}>
                      ${(line.price * line.quantity).toFixed(2)}
                    </Typography>
                    <IconButton
                      size="small"
                      aria-label={`Remove ${line.name}`}
                      onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Total ${total.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}

            <Divider />
            <Typography variant="subtitle1" fontWeight={600}>
              Delivery
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField label="Street" value={street} onChange={(e) => setStreet(e.target.value)} sx={{ flex: 2, minWidth: 220 }} />
              <TextField label="Parish" value={parish} onChange={(e) => setParish(e.target.value)} sx={{ flex: 1, minWidth: 160 }} />
            </Box>
            <TextField
              label="Delivery instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              multiline
              minRows={2}
            />
            <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            {saveError && <Alert severity="error">{saveError}</Alert>}
          </Box>
        )}
      </DialogContent>
      {!configuring && (
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submit}
            disabled={saving || !client || !week || lines.length === 0}
          >
            {saving ? 'Adding…' : `Add order${lines.length ? ` · $${total.toFixed(2)}` : ''}`}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
