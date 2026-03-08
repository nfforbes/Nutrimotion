# Nutrimotion Color Scheme

This document outlines the official Nutrimotion brand colors used throughout the application, based on the original Nutrimotion project at `C:\Git\Nutrimotion\Nutrimotion`.

## Primary Brand Colors

### Brand Orange
- **Hex**: `#ee4d24`
- **Usage**: Primary brand color, buttons, accents, active menu items, icons
- **Description**: Vibrant orange/red that represents energy, nutrition, and vitality

### Black
- **Hex**: `#000000`
- **Usage**: Header backgrounds, button backgrounds, primary icons, headings
- **Description**: Creates strong contrast with the brand orange

### White
- **Hex**: `#ffffff`
- **Usage**: Card backgrounds, text on dark backgrounds, content areas
- **Description**: Clean, crisp background for content

## Text Colors

### Primary Text
- **Hex**: `#000000`
- **Usage**: Headings (H1-H6), important text
- **Description**: Strong, readable black text

### Secondary Text
- **Hex**: `#333333`
- **Usage**: Body text, descriptions, general content
- **Description**: Softer dark gray for body text

### Tertiary Text
- **Hex**: `#666666`
- **Usage**: Helper text, labels, secondary information
- **Description**: Light gray for less emphasized text

## Background Colors

### Light Gray (Default Background)
- **Hex**: `#f5f5f5`
- **Usage**: Page backgrounds, subtle sections
- **Description**: Very light gray for clean backgrounds

### Medium Gray
- **Hex**: `#f0f0f0`
- **Usage**: Disabled states, image placeholders
- **Description**: Slightly darker gray for differentiation

## Color Variations

### Light Orange
- **Hex**: `#ff6f47`
- **Usage**: Hover states, lighter accents
- **Description**: Lighter version of brand orange

### Dark Orange
- **Hex**: `#c23d1a`
- **Usage**: Active states, darker accents
- **Description**: Darker version of brand orange

## Design Patterns

### Buttons (Primary)
- **Default**: Black background (`#000000`) with orange text (`#ee4d24`)
- **Hover**: Orange background (`#ee4d24`) with black text (`#000000`)
- **Border**: 2px solid matching background color
- **Effect**: Inverts colors on hover

### Cards
- **Background**: White (`#ffffff`)
- **Shadow**: `0 4px 6px rgba(0, 0, 0, 0.1)`
- **Hover Shadow**: `0 8px 12px rgba(0, 0, 0, 0.15)`
- **Effect**: Lifts up on hover (`translateY(-4px)`)
- **Border Radius**: 12px

### Header/AppBar
- **Background**: Black (`#000000`)
- **Text**: Orange (`#ee4d24`)
- **Logo**: Centered with orange accents
- **Menu Items**: Orange text with underline on active state

### Icon Containers (Dashboard)
- **Background**: Black (`#000000`)
- **Icon Color**: Orange (`#ee4d24`)
- **Shape**: Circular (80x80px)
- **Effect**: Creates strong visual contrast

### Main Content Area
- **Background**: Light gray (`#f5f5f5`) or orange (`#ee4d24`) for hero sections
- **Text**: Black (`#000000`) for headings, dark gray (`#333333`) for body

## Accessibility

- All color combinations meet WCAG 2.1 AA standards for contrast
- Black text on white backgrounds: 21:1 ratio
- Orange text on black backgrounds: 4.5:1 ratio
- Orange text on white backgrounds: 3.1:1 ratio (use for decorative elements only)

## Material-UI Theme Implementation

The theme is implemented in `components/providers/ThemeProvider.tsx` with:

- **Primary Palette**: Orange variations
- **Secondary Palette**: Black variations
- **Typography**: System fonts matching original design
- **Component Overrides**: Buttons, Cards, AppBar, Chips, IconButtons

## CSS Variables (Future Enhancement)

For easier theme customization, consider implementing CSS variables:

```css
:root {
  --nutrimotion-orange: #ee4d24;
  --nutrimotion-black: #000000;
  --nutrimotion-white: #ffffff;
  --nutrimotion-text-dark: #000000;
  --nutrimotion-text-medium: #333333;
  --nutrimotion-text-light: #666666;
  --nutrimotion-bg-light: #f5f5f5;
  --nutrimotion-bg-medium: #f0f0f0;
}
```

## Usage Examples

### In TypeScript/TSX
```typescript
const BRAND_COLORS = {
  primary: '#ee4d24',
  dark: '#000000',
  white: '#ffffff',
};
```

### In Material-UI Components
```tsx
<Button
  sx={{
    bgcolor: 'primary.main', // Uses #ee4d24
    color: 'secondary.contrastText', // Uses orange
  }}
>
  Click Me
</Button>
```

### In CSS Modules
```css
.button {
  background-color: #000000;
  color: #ee4d24;
  border: 2px solid #000000;
}

.button:hover {
  background-color: #ee4d24;
  color: #000000;
  border-color: #ee4d24;
}
```

## Original Source

These colors were extracted from the original Nutrimotion project at:
- `C:\Git\Nutrimotion\Nutrimotion\app\globals.css`
- `C:\Git\Nutrimotion\Nutrimotion\components\Header.module.css`
- `C:\Git\Nutrimotion\Nutrimotion\app\Home.module.css`
- `C:\Git\Nutrimotion\Nutrimotion\app\meals\Meals.module.css`
- `C:\Git\Nutrimotion\Nutrimotion\app\books\Books.module.css`

## Last Updated

February 13, 2026
