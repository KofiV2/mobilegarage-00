import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './i18n';
import './rtl.css';
import './theme.css';

import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import AdminLayout from './components/AdminLayout';
import ErrorBoundary from './components/ErrorBoundary';
import RouteErrorBoundary from './components/RouteErrorBoundary';
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
    <ErrorBoundary name="App" title="Application Error" message="The application has encountered an unexpected error. Please refresh the page or contact support if the problem persists.">
      <div className="app">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RouteErrorBoundary routeName="Landing Page"><LandingPage /></RouteErrorBoundary>} />
          <Route path="/guest-booking" element={<RouteErrorBoundary routeName="Guest Booking"><GuestBooking /></RouteErrorBoundary>} />
          <Route path="/login" element={<RouteErrorBoundary routeName="Login"><Login /></RouteErrorBoundary>} />
          <Route path="/register" element={<RouteErrorBoundary routeName="Register"><Register /></RouteErrorBoundary>} />

          {/* Customer Routes */}
          <Route path="/dashboard" element={<><Navbar /><PrivateRoute><RouteErrorBoundary routeName="Dashboard"><Home /></RouteErrorBoundary></PrivateRoute></>} />
          <Route path="/services" element={<><Navbar /><PrivateRoute><RouteErrorBoundary routeName="Services"><Services /></RouteErrorBoundary></PrivateRoute></>} />
          <Route path="/bookings" element={<><Navbar /><PrivateRoute><RouteErrorBoundary routeName="Bookings"><Bookings /></RouteErrorBoundary></PrivateRoute></>} />
          <Route path="/booking/:id" element={<><Navbar /><PrivateRoute><RouteErrorBoundary routeName="Booking Details"><BookingDetails /></RouteErrorBoundary></PrivateRoute></>} />
          <Route path="/book/:serviceId" element={<><Navbar /><PrivateRoute><RouteErrorBoundary routeName="New Booking"><NewBooking /></RouteErrorBoundary></PrivateRoute></>} />
          <Route path="/profile" element={<><Navbar /><PrivateRoute><RouteErrorBoundary routeName="Profile"><Profile /></RouteErrorBoundary></PrivateRoute></>} />
          <Route path="/vehicles" element={<><Navbar /><PrivateRoute><RouteErrorBoundary routeName="Vehicles"><Vehicles /></RouteErrorBoundary></PrivateRoute></>} />
          <Route path="/loyalty" element={<><Navbar /><PrivateRoute><RouteErrorBoundary routeName="Loyalty"><Loyalty /></RouteErrorBoundary></PrivateRoute></>} />
          <Route path="/wallet" element={<><Navbar /><PrivateRoute><RouteErrorBoundary routeName="Wallet"><Wallet /></RouteErrorBoundary></PrivateRoute></>} />

          {/* Admin Routes with Sidebar */}
          <Route path="/admin/dashboard" element={<AdminRoute><RouteErrorBoundary routeName="Admin Dashboard"><AdminDashboard /></RouteErrorBoundary></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><RouteErrorBoundary routeName="Users Management"><UsersManagement /></RouteErrorBoundary></AdminRoute>} />
          <Route path="/admin/staff" element={<AdminRoute><RouteErrorBoundary routeName="Staff Management"><StaffManagement /></RouteErrorBoundary></AdminRoute>} />
          <Route path="/admin/bookings" element={<AdminRoute><RouteErrorBoundary routeName="Bookings Management"><BookingsManagement /></RouteErrorBoundary></AdminRoute>} />
          <Route path="/admin/services" element={<AdminRoute><RouteErrorBoundary routeName="Services Management"><ServicesManagement /></RouteErrorBoundary></AdminRoute>} />
          <Route path="/admin/analytics" element={<AdminRoute><RouteErrorBoundary routeName="Analytics"><Analytics /></RouteErrorBoundary></AdminRoute>} />

          {/* Staff Routes */}
          <Route path="/staff/dashboard" element={<><Navbar /><PrivateRoute><RouteErrorBoundary routeName="Staff Dashboard"><StaffDashboard /></RouteErrorBoundary></PrivateRoute></>} />

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
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
