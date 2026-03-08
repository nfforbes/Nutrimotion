/**
 * Material UI Theme Provider
 */

'use client';

import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode } from 'react';

// Nutrimotion Brand Colors (from original project)
const NUTRIMOTION_BRAND = {
  orange: '#ee4d24',      // Primary brand color (vibrant orange/red)
  black: '#000000',       // Dark accents and text
  white: '#ffffff',       // Cards and light backgrounds
  textDark: '#000000',    // Primary text
  textMedium: '#333333',  // Secondary text
  textLight: '#666666',   // Tertiary text
  grayLight: '#f5f5f5',   // Light backgrounds
  grayMedium: '#f0f0f0',  // Subtle backgrounds
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: NUTRIMOTION_BRAND.orange,      // #ee4d24 - Brand orange
      light: '#ff6f47',                     // Lighter orange
      dark: '#c23d1a',                      // Darker orange
      contrastText: NUTRIMOTION_BRAND.white,
    },
    secondary: {
      main: NUTRIMOTION_BRAND.black,       // #000000 - Black for contrast
      light: '#333333',
      dark: '#000000',
      contrastText: NUTRIMOTION_BRAND.orange,
    },
    error: {
      main: '#d32f2f',
      contrastText: '#fff',
    },
    warning: {
      main: '#ed6c02',
      contrastText: '#fff',
    },
    info: {
      main: '#0288d1',
      contrastText: '#fff',
    },
    success: {
      main: '#2e7d32',
      contrastText: '#fff',
    },
    background: {
      default: NUTRIMOTION_BRAND.grayLight,  // Light gray background
      paper: NUTRIMOTION_BRAND.white,        // White cards
    },
    text: {
      primary: NUTRIMOTION_BRAND.textDark,   // Black text
      secondary: NUTRIMOTION_BRAND.textMedium, // Dark gray text
      disabled: NUTRIMOTION_BRAND.textLight,  // Light gray text
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    h1: {
      fontWeight: 700,
      color: NUTRIMOTION_BRAND.textDark,
    },
    h2: {
      fontWeight: 600,
      color: NUTRIMOTION_BRAND.textDark,
    },
    h3: {
      fontWeight: 600,
      color: NUTRIMOTION_BRAND.textDark,
    },
    h4: {
      fontWeight: 600,
      color: NUTRIMOTION_BRAND.textDark,
    },
    h5: {
      fontWeight: 500,
      color: NUTRIMOTION_BRAND.textDark,
    },
    h6: {
      fontWeight: 500,
      color: NUTRIMOTION_BRAND.textDark,
    },
    body1: {
      color: NUTRIMOTION_BRAND.textMedium,
    },
    body2: {
      color: NUTRIMOTION_BRAND.textMedium,
    },
  },
  shape: {
    borderRadius: 12, // Rounded corners like original
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '6px',
          padding: '0.75rem 1.5rem',
          transition: 'all 0.2s ease',
        },
        contained: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 8px 12px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        containedPrimary: {
          backgroundColor: NUTRIMOTION_BRAND.black,
          color: NUTRIMOTION_BRAND.orange,
          '&:hover': {
            backgroundColor: NUTRIMOTION_BRAND.orange,
            color: NUTRIMOTION_BRAND.black,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: NUTRIMOTION_BRAND.black,
          color: NUTRIMOTION_BRAND.orange,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
        colorError: {
          backgroundColor: NUTRIMOTION_BRAND.orange,
          color: NUTRIMOTION_BRAND.white,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: NUTRIMOTION_BRAND.orange,
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(238, 77, 36, 0.1)',
          },
        },
      },
    },
  },
});

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
