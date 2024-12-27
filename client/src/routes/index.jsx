import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import AdminPanel from '../pages/AdminPanel';
import SiteSubmission from '../components/user/SiteSubmission';
import SitesManagement from '../pages/SitesManagement';
import ManageVLANRanges from '../components/admin/ManageVLANBlocks';
import ManageIPBlocks from '../components/admin/ManageIPBlocks';
import ManageRegions from '../components/admin/ManageRegions';
import ManageVCIDRanges from '../components/admin/ManageVCIDRanges';
import ConfigurationGenerator from '../components/config/ConfigurationGenerator';
import NetworkSettings from '../components/admin/NetworkSettings';
import InfrastructureManager from '../components/admin/InfrastructureManager';
import ManageMSPs from '../components/admin/ManageMSPs';
import PseudowireGenerator from '../components/config/PseudowireGenerator';

const AppRoutes = () => {
  const { user } = useAuth();
  console.log('User in routes:', user);

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/logout" element={user ? <Login /> : <Navigate to="/login" replace />} />
      <Route path="/" element={
        user ? (
          console.log('Rendering Dashboard') || <Dashboard />
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      <Route path="/generate-ip" element={user ? <SiteSubmission /> : <Navigate to="/login" replace />} />
      <Route path="/admin" element={user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" replace />} />
      <Route path="/vlan-ranges" element={user?.role === 'admin' ? <ManageVLANRanges/> : <Navigate to="/" replace />} />
      <Route path="/ip-blocks" element={user?.role === 'admin' ? <ManageIPBlocks/> : <Navigate to="/" replace />} />
      <Route path="/regions" element={user?.role === 'admin' ? <ManageRegions/> : <Navigate to="/" replace />} /> 

      <Route path="/vcid-ranges" element={
        console.log('Rendering VCID route') ||
        user?.role === 'admin' ? <ManageVCIDRanges/> : <Navigate to="/" replace />
      } />
      <Route path="/config-generator" element={user?.role === 'admin' ? <ConfigurationGenerator/> : <Navigate to="/" replace />} />
      <Route path="/infra-manager" element={user?.role === 'admin' ? <InfrastructureManager/> : <Navigate to="/" replace />} />
      <Route path="/sites" element={user?.role === 'admin' ? <SitesManagement/> : <Navigate to="/" replace />} />
      <Route path="/pseudowire-generator" element={user?.role === 'admin' ? <PseudowireGenerator /> : <Navigate to="/" replace />} />

      
    </Routes>
  );
};

export default AppRoutes;