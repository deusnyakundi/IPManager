import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [theme, setTheme] = useState(true); // true for dark, false for light

  const toggleTheme = () => {
    setTheme(!theme);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!credentials.username || !credentials.password) {
      return;
    }

    const success = await login(credentials);
    if (success) {
      navigate('/');
    }
  };

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#1976D2',
      },
      background: {
        default: '#212121',
        paper: '#424242',
      },
      text: {
        primary: '#ffffff',
      },
    },
  });

  const lightTheme = createTheme({
    palette: {
      mode: 'light',
    },
  });

  return (
    <ThemeProvider theme={theme ? darkTheme : lightTheme}>
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          width: '100%',
          backgroundColor: theme ? '#212121' : '#f5f5f5',
          overflow: 'hidden',
        }}
      >
        {/* Toggle Icon */}
        <IconButton
          onClick={toggleTheme}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: theme ? '#fff' : '#000',
          }}
        >
          {theme ? <Brightness7 /> : <Brightness4 />}
        </IconButton>

        {/* Right Side for Login */}
        <Box
          sx={{
            width: '40%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
          }}
        >
          <Paper
            elevation={6}
            sx={{
              padding: 4,
              width: '80%',
              maxWidth: '400px',
              textAlign: 'center',
              borderRadius: '16px',
              backgroundColor: theme ? '#424242' : '#ffffff',
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom>
              Login
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Username"
                margin="normal"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
                required
                error={!credentials.username}
                helperText={!credentials.username && 'Username is required'}
                sx={{ input: { color: theme ? '#fff' : '#000' } }}
              />
              <TextField
                fullWidth
                type="password"
                label="Password"
                margin="normal"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                required
                error={!credentials.password}
                helperText={!credentials.password && 'Password is required'}
                sx={{ input: { color: theme ? '#fff' : '#000' } }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Login'}
              </Button>
            </form>
          </Paper>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Login;
