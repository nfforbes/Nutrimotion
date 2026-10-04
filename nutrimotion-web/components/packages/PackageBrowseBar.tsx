'use client';

import { Box, FormControl, InputLabel, MenuItem, Select, ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
  PACKAGE_SPAN_LABELS,
  PACKAGE_SPAN_ORDER,
  PackageSort,
  PackageSpanFilter,
} from '@/lib/packages/organize';

export default function PackageBrowseBar({
  span,
  sort,
  onSpanChange,
  onSortChange,
}: {
  span: PackageSpanFilter;
  sort: PackageSort;
  onSpanChange: (span: PackageSpanFilter) => void;
  onSortChange: (sort: PackageSort) => void;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 3,
      }}
    >
      <ToggleButtonGroup
        exclusive
        size="small"
        value={span}
        onChange={(_, value: PackageSpanFilter | null) => {
          if (value) onSpanChange(value);
        }}
        aria-label="Filter packages"
      >
        <ToggleButton value="all">All</ToggleButton>
        {PACKAGE_SPAN_ORDER.map((key) => (
          <ToggleButton key={key} value={key}>
            {PACKAGE_SPAN_LABELS[key].replace(' packages', '')}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel id="package-sort-label">Sort</InputLabel>
        <Select
          labelId="package-sort-label"
          label="Sort"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as PackageSort)}
        >
          <MenuItem value="price-asc">Price: low to high</MenuItem>
          <MenuItem value="price-desc">Price: high to low</MenuItem>
          <MenuItem value="meals-asc">Meals: fewest first</MenuItem>
          <MenuItem value="meals-desc">Meals: most first</MenuItem>
          <MenuItem value="name">Name</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
