import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import AdminPanel from '../pages/AdminPanel';
import SiteSubmission from '../components/user/SiteSubmission';
import ManageVLANRanges from '../components/admin/ManageVLANBlocks';
import ManageIPBlocks from '../components/admin/ManageIPBlocks';
import ManageRegions from '../components/admin/ManageRegions';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/logout" element={user ? <Login /> : <Navigate to="/login" replace />} />
      <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="/generate-ip" element={user ? <SiteSubmission /> : <Navigate to="/login" replace />} />
      <Route path="/admin" element={user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" replace />} />
      <Route path="/vlan-ranges" element={user?.role === 'admin' ? <ManageVLANRanges/> : <Navigate to="/" replace />} />
      <Route path="/ip-blocks" element={user?.role === 'admin' ? <ManageIPBlocks/> : <Navigate to="/" replace />} />
      <Route path="/regions" element={user?.role === 'admin' ? <ManageRegions/> : <Navigate to="/" replace />} />
      <Route path="/sites" element={user?.role === 'admin' ? <SiteSubmission/> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      
    </Routes>
  );
};

export default AppRoutes;