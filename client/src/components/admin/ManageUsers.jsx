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
  Switch,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    role: 'user',
    forcePasswordChange: true
  });

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
    if (!newUser.username || !newUser.password || !newUser.email) return;
    try {
      await userAPI.createUser(newUser);
      setNewUser({
        username: '',
        email: '',
        password: '',
        phone: '',
        role: 'user',
        forcePasswordChange: true
      });
      setOpenDialog(false);
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

  const handleToggle2FA = async (id, enabled) => {
    try {
      await userAPI.toggle2FA(id, enabled);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling 2FA:', error);
    }
  };

  return (
    <Container maxWidth="xl" disableGutters sx={{ height: '100vh', minWidth: 0, overflow: 'auto', bgcolor: 'background.paper' }}>
      <Box sx={{ mb: 0.5, minWidth: 'min-content' }}>
        <Paper elevation={0} sx={{ p: 1, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', borderRadius: 0 }}>
          <Grid container justifyContent="space-between" alignItems="center" spacing={1}>
            <Grid item>
              <Typography variant="h4" sx={{ fontSize: '1.25rem', lineHeight: 1, m: 0 }}>
                Manage Users
              </Typography>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setOpenDialog(true)}
                size="small"
              >
                Add User
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ mt: 1, borderRadius: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>2FA</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Tooltip title={user.two_factor_enabled ? "Disable 2FA" : "Enable 2FA"}>
                        <Switch
                          size="small"
                          checked={user.two_factor_enabled}
                          onChange={() => handleToggle2FA(user.id, !user.two_factor_enabled)}
                          color="primary"
                        />
                      </Tooltip>
                    </TableCell>
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
        </Paper>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Username"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Initial Password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
              fullWidth
              helperText="User will be required to change this password on first login"
            />
            <TextField
              label="Phone Number"
              value={newUser.phone}
              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                label="Role"
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="planner">Planner</MenuItem>
                <MenuItem value="support">Support</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddUser} variant="contained">Add User</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageUsers;