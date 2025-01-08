// client/src/App.jsx
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import AppRoutes from "./routes/index";
import { useEffect } from "react";
import { initializeSessionTimeout } from "./utils/sessionManager";
import SessionTimeoutDialog from "./components/common/SessionTimeoutDialog";

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  spacing: (factor) => `${0.5 * factor}rem`,
  components: {
    MuiFormControl: {
      styleOverrides: {
        root: {
          margin: '20px 0',
          width: '100%',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          color: '#2c3e50',
          '&.Mui-focused': {
            color: '#1976d2',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          backgroundColor: '#fff',
          '&.Mui-focused': {
            boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
          },
        },
        input: {
          padding: '14px',
          color:'#000',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '48px !important',
          '@media (min-width: 600px)': {
            minHeight: '48px !important',
          },
        },
      },
    },
  },
});

function App() {
  useEffect(() => {
    // Check for existing session on app load
    const token = localStorage.getItem('token');
    if (token) {
      const lastActivity = localStorage.getItem('lastActivity');
      const currentTime = new Date().getTime();
      
      // If last activity was more than 30 minutes ago, clear the session
      if (lastActivity && (currentTime - parseInt(lastActivity)) > 30 * 60 * 1000) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('lastActivity');
        window.location.href = '/login';
      } else {
        // Update last activity
        localStorage.setItem('lastActivity', currentTime.toString());
      }
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <SessionTimeoutDialog />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;