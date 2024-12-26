import React, { useEffect, useState } from 'react';
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
} from '@mui/material';

const commands = [
  '> Connecting to Njiru_chokaa-OLT...',
  'Njiru_chokaa-OLT>enable',
  'Njiru_chokaa-OLT>',
  'Njiru_chokaa-OLT#config',
  '> Entering configuration mode...',
  'Njiru_chokaa-OLT(config)#display current-configuration',
  '> Retrieving configuration details...',
  'Njiru_chokaa-OLT(config)#display ont optical-info 14 all',
  '> Displaying ONT optical details for port 14...',
  'Njiru_chokaa-OLT(config)#exit',
  '> Exiting configuration mode...',
];

const TerminalSimulation = () => {
  const [displayedCommands, setDisplayedCommands] = useState([]);
  const [simulationCompleted, setSimulationCompleted] = useState(false);

  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      if (index < commands.length) {
        setDisplayedCommands((prev) => [...prev, commands[index]]);
        index++;
      } else {
        clearInterval(interval);
        setSimulationCompleted(true); // Mark simulation as complete
      }
    }, 1500); // Adjust delay between commands

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        width: '50%',
        height: '40%',
        mt:25,
        ml:5,
        backgroundColor: '#000',
        color: '#0f0',
        fontFamily: 'monospace',
        padding: 2,
        overflowY: 'auto',
        display: simulationCompleted ? 'block' : 'block',
       
      }}
    >
      {displayedCommands.map((cmd, i) => (
        <Typography key={i}>{cmd}</Typography>
      ))}
    </Box>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(credentials);
    if (success) {
      navigate('/');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
      }}
    >
      {/* CLI Terminal Simulation */}
      <TerminalSimulation />

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
            backgroundColor: '#ffffff',
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
  );
};

export default Login;
