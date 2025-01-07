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
  Alert,
  FormHelperText,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditUserDialog from './EditUserDialog';
import ConfirmDialog from '../common/ConfirmDialog';
import { getValidationError } from '../../utils/validation';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openConfirmEdit, setOpenConfirmEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [pendingEditData, setPendingEditData] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'user'
  });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const validateForm = () => {
    const errors = {};
    ['username', 'email', 'password', 'phone', 'role'].forEach(field => {
      const errorMessage = getValidationError(field, newUser[field]);
      if (errorMessage) {
        errors[field] = errorMessage;
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async () => {
    setError('');
    if (!validateForm()) {
      return;
    }

    try {
      const response = await userAPI.createUser(newUser);
      setUsers([...users, response.data]);
      setOpenDialog(false);
      setNewUser({
        username: '',
        password: '',
        email: '',
        phone: '',
        role: 'user'
      });
      setFormErrors({});
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleEditUser = async (updatedData) => {
    setPendingEditData(updatedData);
    setOpenEditDialog(false);
    setOpenConfirmEdit(true);
  };

  const handleConfirmEdit = async () => {
    if (!selectedUser || !pendingEditData) return;
    
    try {
      await userAPI.updateUser(selectedUser.id, pendingEditData);
      await fetchUsers();
      setOpenConfirmEdit(false);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    } finally {
      setPendingEditData(null);
      setSelectedUser(null);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await userAPI.deleteUser(selectedUser.id);
      setOpenDeleteDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleToggle2FA = async (userId, enabled) => {
    try {
      await userAPI.toggle2FA(userId, { enabled });
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
                      <Switch
                        size="small"
                        checked={user.two_factor_enabled}
                        onChange={(e) => handleToggle2FA(user.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit User">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedUser(user);
                            setOpenEditDialog(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete User">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedUser(user);
                            setOpenDeleteDialog(true);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              label="Username"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              required
              fullWidth
              error={!!formErrors.username}
              helperText={formErrors.username}
            />
            <TextField
              label="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
              fullWidth
              error={!!formErrors.email}
              helperText={formErrors.email}
            />
            <TextField
              label="Initial Password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
              fullWidth
              error={!!formErrors.password}
              helperText={formErrors.password || "User will be required to change this password on first login"}
            />
            <TextField
              label="Phone Number"
              value={newUser.phone}
              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              fullWidth
              error={!!formErrors.phone}
              helperText={formErrors.phone}
            />
            <FormControl fullWidth error={!!formErrors.role}>
              <InputLabel>Role</InputLabel>
              <Select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                label="Role"
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="support">Support</MenuItem>
                <MenuItem value="planner">Planner</MenuItem>
              </Select>
              {formErrors.role && (
                <FormHelperText>{formErrors.role}</FormHelperText>
              )}
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setFormErrors({});
            setError('');
          }}>
            Cancel
          </Button>
          <Button onClick={handleAddUser} variant="contained">Add User</Button>
        </DialogActions>
      </Dialog>

      <EditUserDialog
        open={openEditDialog}
        onClose={() => {
          setOpenEditDialog(false);
        }}
        user={selectedUser}
        onSave={handleEditUser}
      />

      <ConfirmDialog
        open={openConfirmEdit}
        onClose={() => {
          setOpenConfirmEdit(false);
        }}
        onConfirm={handleConfirmEdit}
        title="Edit User"
        content={`Are you sure you want to update user "${selectedUser?.username}"?`}
        confirmButtonText="Update"
        cancelButtonText="Cancel"
        confirmButtonColor="primary"
      />

      <ConfirmDialog
        open={openDeleteDialog}
        onClose={() => {
          setOpenDeleteDialog(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteUser}
        title="Delete User"
        content={`Are you sure you want to delete user "${selectedUser?.username}"? This action cannot be undone.`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        confirmButtonColor="error"
      />
    </Container>
  );
};

export default ManageUsers;