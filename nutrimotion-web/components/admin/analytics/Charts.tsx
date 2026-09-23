'use client';

import { Box, Typography } from '@mui/material';

export interface BarDatum {
  label: string;
  value: number;
  secondary?: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: BarDatum[];
  height?: number;
  valueFormatter?: (n: number) => string;
  emptyMessage?: string;
}

export function SimpleBarChart({
  data,
  height = 200,
  valueFormatter = (n) => String(n),
  emptyMessage = 'No data in this period',
}: SimpleBarChartProps) {
  if (!data.length || data.every((d) => d.value <= 0)) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const showEvery = data.length > 14 ? Math.ceil(data.length / 8) : 1;

  return (
    <Box sx={{ height, display: 'flex', alignItems: 'flex-end', gap: 0.5, px: 0.5 }}>
      {data.map((d, i) => {
        const pct = Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0);
        return (
          <Box
            key={`${d.label}-${i}`}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%',
              justifyContent: 'flex-end',
              minWidth: 0,
            }}
            title={`${d.label}: ${valueFormatter(d.value)}`}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 28,
                height: `${pct}%`,
                bgcolor: d.color || 'primary.main',
                borderRadius: '4px 4px 0 0',
                opacity: d.value > 0 ? 1 : 0.15,
                transition: 'height 0.2s ease',
              }}
            />
            {i % showEvery === 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  fontSize: 9,
                  writingMode: data.length > 10 ? 'vertical-rl' : 'horizontal-tb',
                  transform: data.length > 10 ? 'rotate(180deg)' : undefined,
                  maxHeight: 48,
                  overflow: 'hidden',
                }}
              >
                {d.label.slice(5)}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

interface HorizontalBarsProps {
  data: BarDatum[];
  valueFormatter?: (n: number) => string;
  emptyMessage?: string;
}

export function HorizontalBars({
  data,
  valueFormatter = (n) => String(n),
  emptyMessage = 'No data in this period',
}: HorizontalBarsProps) {
  if (!data.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyMessage}
      </Typography>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {data.map((d) => (
        <Box key={d.label}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, gap: 1 }}>
            <Typography variant="body2" noWrap title={d.label}>
              {d.label}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
              {valueFormatter(d.value)}
            </Typography>
          </Box>
          <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, height: 8, overflow: 'hidden' }}>
            <Box
              sx={{
                width: `${(d.value / max) * 100}%`,
                height: '100%',
                bgcolor: d.color || 'primary.main',
                borderRadius: 1,
              }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
