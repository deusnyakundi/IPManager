import React, { useState, useEffect } from 'react';
import { userAPI } from '../../utils/api';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) return;
    try {
      await userAPI.createUser(newUser);
      setNewUser({ username: '', password: '', role: 'user' });
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await userAPI.deleteUser(id);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <Container 
      maxWidth="xl"
      disableGutters
      sx={{ 
        height: '100%',
        minWidth: 0,
        overflow: 'auto',
        backgroundColor: 'background.paper', 
      }}
    >
      <Box sx={{ 
        mb: 0.5,
        minWidth: 'min-content',
      }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 1, 
            backgroundColor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            borderRadius: 0,
          }}
        >
          <Grid 
            container 
            justifyContent="space-between" 
            alignItems="center" 
            spacing={1}
            sx={{ 
              minHeight: '36px',
              py: 0
            }}
          >
            <Grid item>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontSize: '1.25rem',
                  lineHeight: 1,
                  m: 0,
                  color: 'text.primary',
                }}
              >
                Manage Users
              </Typography>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  label="Username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  sx={{ 
                    width: '200px',
                    '& .MuiInputBase-root': { height: '32px' }
                  }}
                />
                <TextField
                  size="small"
                  label="Password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  sx={{ 
                    width: '200px',
                    '& .MuiInputBase-root': { height: '32px' }
                  }}
                />
                <FormControl size="small" sx={{ width: '150px' }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    label="Role"
                    sx={{ height: '32px' }}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="planner">Planner</MenuItem>
                    <MenuItem value="support">Support</MenuItem>
                  </Select>
                </FormControl>
                <Button 
                  variant="contained" 
                  onClick={handleAddUser}
                  size="small"
                  sx={{ height: '32px' }}
                >
                  Add User
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ 
          mt: 1,
          borderRadius: 0,
        }}>
          <Box sx={{ p: 1 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ManageUsers;