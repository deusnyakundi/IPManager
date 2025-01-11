import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import UserRegistration from '../components/admin/UserRegistration';
import { useAuth } from '../context/AuthContext';
import ChangePassword from '../components/auth/ChangePassword';
import ManageUsers from '../components/admin/ManageUsers';
import ManageIPBlocks from '../components/admin/ManageIPBlocks';
import ManageVLANRanges from '../components/admin/ManageVLANRanges';
import ManageVCIDRanges from '../components/admin/ManageVCIDRanges';
import Sites from '../pages/Sites';
import ConfigGenerator from '../components/config/ConfigurationGenerator';
import InfrastructureManager from '../components/admin/InfrastructureManager';
import SecuritySettings from '../components/settings/SecuritySettings';
import NavBar from '../components/layout/NavBar';
import SiteSubmission from '../components/user/SiteSubmission';
import PseudowireGenerator from '../components/config/PseudowireGenerator';
import Analytics from '../pages/Analytics';
import IPAssignments from '../components/ip/IPAssignments';

const AppRoutes = () => {
    const { isAuthenticated, user } = useAuth();

    // Protected Route Component
    const ProtectedRoute = ({ children, adminOnly = false }) => {
        if (!isAuthenticated) {
            return <Navigate to="/login" />;
        }

        if (adminOnly && user?.role !== 'admin') {
            return <Navigate to="/" />;
        }

        return children;
    };

    // Public routes (Login and Change Password) don't need NavBar
    if (!isAuthenticated || window.location.pathname === '/change-password') {
        return (
            <Routes>
                <Route
                    path="/login"
                    element={
                        isAuthenticated ? <Navigate to="/" /> : <Login />
                    }
                />
                <Route
                    path="/change-password/:userId"
                    element={<ChangePassword />}
                />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        );
    }

    // Protected routes with NavBar
    return (
        <NavBar>
            <Routes>
                {/* Protected Routes */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Admin Routes */}
                <Route
                    path="/admin/register"
                    element={
                        <ProtectedRoute adminOnly>
                            <UserRegistration />
                        </ProtectedRoute>
                    }
                />

                {/* Site Management */}
                <Route
                    path="/sites"
                    element={
                        <ProtectedRoute adminOnly>
                            <Sites />
                        </ProtectedRoute>
                    }
                />

                {/* IP Blocks Management */}
                <Route
                    path="/ip-blocks"
                    element={
                        <ProtectedRoute adminOnly>
                            <ManageIPBlocks />
                        </ProtectedRoute>
                    }
                />

                {/* VLAN Ranges Management */}
                <Route
                    path="/vlan-ranges"
                    element={
                        <ProtectedRoute adminOnly>
                            <ManageVLANRanges />
                        </ProtectedRoute>
                    }
                />

                {/* VCID Ranges Management */}
                <Route
                    path="/vcid-ranges"
                    element={
                        <ProtectedRoute adminOnly>
                            <ManageVCIDRanges />
                        </ProtectedRoute>
                    }
                />

                {/* Configuration Generator */}
                <Route
                    path="/config-generator"
                    element={
                        <ProtectedRoute>
                            <ConfigGenerator />
                        </ProtectedRoute>
                    }
                />
                {/* Generate IP */}
                <Route
                    path="/generate-ip"
                    element={
                        <ProtectedRoute>
                            <SiteSubmission />
                        </ProtectedRoute>
                    }
                />

                {/* Infrastructure Manager */}
                <Route
                    path="/infra-manager"
                    element={
                        <ProtectedRoute adminOnly>
                            <InfrastructureManager />
                        </ProtectedRoute>
                    }
                />

                {/* Analytics */}
                <Route
                    path="/analytics"
                    element={
                        <ProtectedRoute>
                            <Analytics />
                        </ProtectedRoute>
                    }
                />

                {/* Settings Routes */}
                <Route
                    path="/settings/security"
                    element={
                        <ProtectedRoute>
                            <SecuritySettings />
                        </ProtectedRoute>
                    }
                />

                {/* Admin Panel */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute adminOnly>
                            <ManageUsers />
                        </ProtectedRoute>
                    }
                />
                {/*Pseudowire Generator*/}
                <Route
                    path="/pseudowire-generator"
                    element={
                        <ProtectedRoute adminOnly>
                            <PseudowireGenerator />
                        </ProtectedRoute>
                    }
                />

                {/* IP Assignments */}
                <Route
                    path="/ip/assignments"
                    element={
                        <ProtectedRoute allowedRoles={['admin', 'support']}>
                            <IPAssignments />
                        </ProtectedRoute>
                    }
                />

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </NavBar>
    );
};

export default AppRoutes;