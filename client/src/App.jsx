// client/src/App.jsx
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import NavBar from "./components/layout/NavBar";
import AppRoutes from "./routes";
import NetworkSettings from './components/admin/NetworkSettings';


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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <NavBar>
            <AppRoutes />
          </NavBar>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;