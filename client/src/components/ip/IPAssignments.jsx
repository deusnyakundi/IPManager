import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Typography,
  Grid,
} from '@mui/material';
import { Edit as EditIcon, FileDownload as ExportIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import api from '../../utils/api';

const IPAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [editVendor, setEditVendor] = useState('');
  const [editPrimaryVcid, setEditPrimaryVcid] = useState('');
  const [editSecondaryVcid, setEditSecondaryVcid] = useState('');
  const [editVsiId, setEditVsiId] = useState('');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Fetch IP assignments
  useEffect(() => {
    fetchAssignments();
  }, []);

  // Filter assignments based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredAssignments(assignments);
      return;
    }

    const filtered = assignments.filter(assignment => 
      Object.values(assignment).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredAssignments(filtered);
  }, [searchTerm, assignments]);

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/ip/assignments');
      setAssignments(response.data.assignments);
      setFilteredAssignments(response.data.assignments);
      
      // Update the stats in the parent component or context if needed
      if (response.data.stats) {
        const { huawei, nokia } = response.data.stats;
        // You might want to update these stats in a parent component or context
        console.log('Vendor stats:', { huawei, nokia });
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setNotification({
        open: true,
        message: 'Failed to fetch IP assignments',
        severity: 'error'
      });
    }
  };

  const handleEdit = (assignment) => {
    setSelectedAssignment(assignment);
    setEditVendor(assignment.vendor || '');
    setEditPrimaryVcid(assignment.primary_vcid || '');
    setEditSecondaryVcid(assignment.secondary_vcid || '');
    setEditVsiId(assignment.vsi_id || '');
    setEditDialog(true);
  };

  const handleConfirmUpdate = () => {
    setEditDialog(false);
    setConfirmDialog(true);
  };

  const handleUpdate = async () => {
    try {
      await api.patch(`/ip/assignments/${selectedAssignment.id}`, {
        vendor: editVendor,
        primary_vcid: editPrimaryVcid || null,
        secondary_vcid: editSecondaryVcid || null,
        vsi_id: editVsiId || null
      });
      await fetchAssignments(); // Refresh the list
      setConfirmDialog(false);
      setNotification({
        open: true,
        message: 'IP assignment updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating assignment:', error);
      setConfirmDialog(false);
      setNotification({
        open: true,
        message: 'Failed to update IP assignment',
        severity: 'error'
      });
    }
  };

  const handleExport = () => {
    try {
      const exportData = filteredAssignments.map(({
        id,
        site_name,
        assigned_ip,
        management_vlan,
        primary_vcid,
        secondary_vcid,
        vsi_id,
        cluster_name,
        vendor,
        assigned_by_user,
        created_at
      }) => ({
        ID: id,
        'Site Name': site_name,
        'IP Address': assigned_ip,
        'VLAN': management_vlan,
        'Primary VCID': primary_vcid,
        'Secondary VCID': secondary_vcid,
        'VSI ID': vsi_id,
        'Cluster': cluster_name,
        'Vendor': vendor || '',
        'Assigned By': assigned_by_user || '',
        'Created At': created_at ? new Date(created_at).toLocaleString() : ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'IP Assignments');
      XLSX.writeFile(wb, 'ip_assignments.xlsx');

      setNotification({
        open: true,
        message: 'Export completed successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      setNotification({
        open: true,
        message: 'Failed to export data',
        severity: 'error'
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 300 }}
        />
        <Button
          variant="contained"
          startIcon={<ExportIcon />}
          onClick={handleExport}
        >
          Export
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Site Name</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>VLAN</TableCell>
              <TableCell>Primary VCID</TableCell>
              <TableCell>Secondary VCID</TableCell>
              <TableCell>VSI ID</TableCell>
              <TableCell>Cluster</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Assigned By</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAssignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>{assignment.site_name}</TableCell>
                <TableCell>{assignment.assigned_ip}</TableCell>
                <TableCell>{assignment.management_vlan}</TableCell>
                <TableCell>{assignment.primary_vcid}</TableCell>
                <TableCell>{assignment.secondary_vcid}</TableCell>
                <TableCell>{assignment.vsi_id}</TableCell>
                <TableCell>{assignment.cluster_name}</TableCell>
                <TableCell>{assignment.vendor || '-'}</TableCell>
                <TableCell>{assignment.assigned_by_user || '-'}</TableCell>
                <TableCell>
                  {assignment.created_at 
                    ? new Date(assignment.created_at).toLocaleString()
                    : '-'}
                </TableCell>
                <TableCell>
                  <IconButton 
                    size="small"
                    onClick={() => handleEdit(assignment)}
                  >
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialog} 
        onClose={() => setEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit IP Assignment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 2 }}>
              <strong>Site Name:</strong> {selectedAssignment?.site_name}
            </Box>
            <Box sx={{ mb: 2 }}>
              <strong>IP Address:</strong> {selectedAssignment?.assigned_ip}
            </Box>
            <Box sx={{ mb: 2 }}>
              <strong>Cluster:</strong> {selectedAssignment?.cluster_name}
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Vendor</InputLabel>
                  <Select
                    value={editVendor}
                    label="Vendor"
                    onChange={(e) => setEditVendor(e.target.value)}
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="Nokia">Nokia</MenuItem>
                    <MenuItem value="Huawei">Huawei</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Primary VCID"
                  type="number"
                  value={editPrimaryVcid}
                  onChange={(e) => setEditPrimaryVcid(e.target.value)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Secondary VCID"
                  type="number"
                  value={editSecondaryVcid}
                  onChange={(e) => setEditSecondaryVcid(e.target.value)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="VSI ID"
                  type="number"
                  value={editVsiId}
                  onChange={(e) => setEditVsiId(e.target.value)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmUpdate} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Update</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography>
              Are you sure you want to update the following values for site <strong>{selectedAssignment?.site_name}</strong>?
            </Typography>
            <Box sx={{ mt: 2 }}>
              <strong>IP Address:</strong> {selectedAssignment?.assigned_ip}
            </Box>
            {editVendor !== selectedAssignment?.vendor && (
              <Box sx={{ mt: 1 }}>
                <strong>Vendor:</strong> {selectedAssignment?.vendor || 'None'} → {editVendor || 'None'}
              </Box>
            )}
            {editPrimaryVcid !== selectedAssignment?.primary_vcid && (
              <Box sx={{ mt: 1 }}>
                <strong>Primary VCID:</strong> {selectedAssignment?.primary_vcid || 'None'} → {editPrimaryVcid || 'None'}
              </Box>
            )}
            {editSecondaryVcid !== selectedAssignment?.secondary_vcid && (
              <Box sx={{ mt: 1 }}>
                <strong>Secondary VCID:</strong> {selectedAssignment?.secondary_vcid || 'None'} → {editSecondaryVcid || 'None'}
              </Box>
            )}
            {editVsiId !== selectedAssignment?.vsi_id && (
              <Box sx={{ mt: 1 }}>
                <strong>VSI ID:</strong> {selectedAssignment?.vsi_id || 'None'} → {editVsiId || 'None'}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default IPAssignments; 