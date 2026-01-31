import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './i18n';
import './rtl.css';
import './theme.css';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import { ConfirmDialogProvider } from './components/ConfirmDialog';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ServicesPage from './pages/ServicesPage';
import TrackPage from './pages/TrackPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';
import ServerErrorPage from './pages/ServerErrorPage';

function App() {
  return (
    <ErrorBoundary name="AppRoot">
      <BrowserRouter>
        <ToastProvider>
          <ConfirmDialogProvider>
            <AuthProvider>
              <ErrorBoundary name="Routes">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<AuthPage />} />

                  {/* Protected routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <ErrorBoundary name="Dashboard">
                        <DashboardPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/services" element={
                    <ProtectedRoute>
                      <ErrorBoundary name="Services">
                        <ServicesPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/track" element={
                    <ProtectedRoute>
                      <ErrorBoundary name="Track">
                        <TrackPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <ErrorBoundary name="Profile">
                        <ProfilePage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/profile/edit" element={
                    <ProtectedRoute>
                      <ErrorBoundary name="EditProfile">
                        <EditProfilePage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />

                  {/* Static pages (protected) */}
                  <Route path="/about" element={
                    <ProtectedRoute>
                      <AboutPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/privacy" element={
                    <ProtectedRoute>
                      <PrivacyPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/terms" element={
                    <ProtectedRoute>
                      <TermsPage />
                    </ProtectedRoute>
                  } />

                  {/* Error pages */}
                  <Route path="/error/500" element={<ServerErrorPage />} />
                  <Route path="/error/404" element={<NotFoundPage />} />

                  {/* Catch all - 404 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </ErrorBoundary>

              {/* Bottom Navigation (shows on all pages except auth) */}
              <BottomNav />
            </AuthProvider>
          </ConfirmDialogProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
