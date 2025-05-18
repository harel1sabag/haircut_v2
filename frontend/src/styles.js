import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Heebo", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      '@media (max-width:600px)': {
        fontSize: '0.9rem',
      },
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          '@media (max-width:600px)': {
            width: '100%',
            margin: '4px 0',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          padding: '16px',
          '@media (max-width:600px)': {
            padding: '8px',
          },
        },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

export default theme;
