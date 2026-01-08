import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './i18n';
import './rtl.css';

import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import AdminLayout from './components/AdminLayout';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorNotification from './components/ErrorNotification';
import GuestBooking from './components/GuestBooking';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Services from './pages/Services';
import Bookings from './pages/Bookings';
import BookingDetails from './pages/BookingDetails';
import NewBooking from './pages/NewBooking';
import Profile from './pages/Profile';
import Vehicles from './pages/Vehicles';
import Loyalty from './pages/Loyalty';
import Wallet from './pages/Wallet';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import UsersManagement from './pages/admin/UsersManagement';
import StaffManagement from './pages/admin/StaffManagement';
import Analytics from './pages/admin/Analytics';
import BookingsManagement from './pages/admin/BookingsManagement';
import ServicesManagement from './pages/admin/ServicesManagement';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';

// Component to wrap admin routes with AdminLayout
const AdminRoute = ({ children }) => {
  return (
    <PrivateRoute>
      <AdminLayout>{children}</AdminLayout>
    </PrivateRoute>
  );
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <ErrorBoundary>
      <div className="app">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
          <Route path="/guest-booking" element={<GuestBooking />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer Routes */}
          <Route path="/dashboard" element={<><Navbar /><PrivateRoute><ErrorBoundary><Home /></ErrorBoundary></PrivateRoute></>} />
          <Route path="/services" element={<><Navbar /><PrivateRoute><ErrorBoundary><Services /></ErrorBoundary></PrivateRoute></>} />
          <Route path="/bookings" element={<><Navbar /><PrivateRoute><ErrorBoundary><Bookings /></ErrorBoundary></PrivateRoute></>} />
          <Route path="/booking/:id" element={<><Navbar /><PrivateRoute><ErrorBoundary><BookingDetails /></ErrorBoundary></PrivateRoute></>} />
          <Route path="/book/:serviceId" element={<><Navbar /><PrivateRoute><ErrorBoundary><NewBooking /></ErrorBoundary></PrivateRoute></>} />
          <Route path="/profile" element={<><Navbar /><PrivateRoute><ErrorBoundary><Profile /></ErrorBoundary></PrivateRoute></>} />
          <Route path="/vehicles" element={<><Navbar /><PrivateRoute><ErrorBoundary><Vehicles /></ErrorBoundary></PrivateRoute></>} />
          <Route path="/loyalty" element={<><Navbar /><PrivateRoute><ErrorBoundary><Loyalty /></ErrorBoundary></PrivateRoute></>} />
          <Route path="/wallet" element={<><Navbar /><PrivateRoute><ErrorBoundary><Wallet /></ErrorBoundary></PrivateRoute></>} />

          {/* Admin Routes with Sidebar */}
          <Route path="/admin/dashboard" element={<AdminRoute><ErrorBoundary><AdminDashboard /></ErrorBoundary></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><ErrorBoundary><UsersManagement /></ErrorBoundary></AdminRoute>} />
          <Route path="/admin/staff" element={<AdminRoute><ErrorBoundary><StaffManagement /></ErrorBoundary></AdminRoute>} />
          <Route path="/admin/bookings" element={<AdminRoute><ErrorBoundary><BookingsManagement /></ErrorBoundary></AdminRoute>} />
          <Route path="/admin/services" element={<AdminRoute><ErrorBoundary><ServicesManagement /></ErrorBoundary></AdminRoute>} />
          <Route path="/admin/analytics" element={<AdminRoute><ErrorBoundary><Analytics /></ErrorBoundary></AdminRoute>} />

          {/* Staff Routes */}
          <Route path="/staff/dashboard" element={<><Navbar /><PrivateRoute><ErrorBoundary><StaffDashboard /></ErrorBoundary></PrivateRoute></>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
        <ErrorNotification />
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
