import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './i18n';
import './rtl.css';
import './theme.css';
import './styles/animations.css';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { ManagerAuthProvider } from './contexts/ManagerAuthContext';
import { StaffAuthProvider } from './contexts/StaffAuthContext';
import { ToastProvider } from './components/Toast';
import { ConfirmDialogProvider } from './components/ConfirmDialog';
import { KeyboardShortcutsProvider } from './contexts/KeyboardShortcutsContext';

// Components (always loaded)
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import ManagerRoute from './components/ManagerRoute';
import StaffRoute from './components/StaffRoute';
import PageTransition from './components/PageTransition';
import LoadingOverlay from './components/LoadingOverlay';
import InstallPrompt from './components/InstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import UpdatePrompt from './components/UpdatePrompt';

// Pages - lazy loaded for code splitting
const AuthPage = React.lazy(() => import('./pages/AuthPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ServicesPage = React.lazy(() => import('./pages/ServicesPage'));
const TrackPage = React.lazy(() => import('./pages/TrackPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const EditProfilePage = React.lazy(() => import('./pages/EditProfilePage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'));
const TermsPage = React.lazy(() => import('./pages/TermsPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const ServerErrorPage = React.lazy(() => import('./pages/ServerErrorPage'));
const ManagerLoginPage = React.lazy(() => import('./pages/ManagerLoginPage'));
const ManagerDashboardPage = React.lazy(() => import('./pages/ManagerDashboardPage'));
const StaffLoginPage = React.lazy(() => import('./pages/StaffLoginPage'));
const StaffOrderEntryPage = React.lazy(() => import('./pages/StaffOrderEntryPage'));
const GuestTrackPage = React.lazy(() => import('./pages/GuestTrackPage'));
const LoyaltyHistoryPage = React.lazy(() => import('./pages/LoyaltyHistoryPage'));

function App() {
  return (
    <ErrorBoundary name="AppRoot">
      <BrowserRouter>
        <ToastProvider>
          <ConfirmDialogProvider>
            <KeyboardShortcutsProvider>
              <AuthProvider>
                <ErrorBoundary name="Routes">
                  <Suspense fallback={<LoadingOverlay />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Navigate to="/auth" replace />} />
                    <Route path="/auth" element={
                      <PageTransition animation="slide-up">
                        <AuthPage />
                      </PageTransition>
                    } />
                    <Route path="/guest-track" element={
                      <PageTransition animation="slide-up">
                        <GuestTrackPage />
                      </PageTransition>
                    } />

                    {/* Protected routes */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <PageTransition animation="slide-up">
                          <ErrorBoundary name="Dashboard">
                            <DashboardPage />
                          </ErrorBoundary>
                        </PageTransition>
                      </ProtectedRoute>
                    } />
                    <Route path="/services" element={
                      <ProtectedRoute>
                        <PageTransition animation="fade">
                          <ErrorBoundary name="Services">
                            <ServicesPage />
                          </ErrorBoundary>
                        </PageTransition>
                      </ProtectedRoute>
                    } />
                    <Route path="/track" element={
                      <ProtectedRoute requireFullAuth>
                        <PageTransition animation="fade">
                          <ErrorBoundary name="Track">
                            <TrackPage />
                          </ErrorBoundary>
                        </PageTransition>
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute requireFullAuth>
                        <PageTransition animation="slide-left">
                          <ErrorBoundary name="Profile">
                            <ProfilePage />
                          </ErrorBoundary>
                        </PageTransition>
                      </ProtectedRoute>
                    } />
                    <Route path="/profile/edit" element={
                      <ProtectedRoute requireFullAuth>
                        <PageTransition animation="slide-up">
                          <ErrorBoundary name="EditProfile">
                            <EditProfilePage />
                          </ErrorBoundary>
                        </PageTransition>
                      </ProtectedRoute>
                    } />
                    <Route path="/loyalty" element={
                      <ProtectedRoute requireFullAuth>
                        <PageTransition animation="slide-up">
                          <ErrorBoundary name="LoyaltyHistory">
                            <LoyaltyHistoryPage />
                          </ErrorBoundary>
                        </PageTransition>
                      </ProtectedRoute>
                    } />

                    {/* Static pages (protected) */}
                    <Route path="/about" element={
                      <ProtectedRoute>
                        <PageTransition animation="fade">
                          <AboutPage />
                        </PageTransition>
                      </ProtectedRoute>
                    } />
                    <Route path="/privacy" element={
                      <ProtectedRoute>
                        <PageTransition animation="fade">
                          <PrivacyPage />
                        </PageTransition>
                      </ProtectedRoute>
                    } />
                    <Route path="/terms" element={
                      <ProtectedRoute>
                        <PageTransition animation="fade">
                          <TermsPage />
                        </PageTransition>
                      </ProtectedRoute>
                    } />

                    {/* Manager/Owner routes - wrapped in ManagerAuthProvider */}
                    <Route path="/manager/login" element={
                      <ManagerAuthProvider>
                        <PageTransition animation="slide-up">
                          <ManagerLoginPage />
                        </PageTransition>
                      </ManagerAuthProvider>
                    } />
                    <Route path="/manager" element={
                      <ManagerAuthProvider>
                        <ManagerRoute>
                          <PageTransition animation="fade">
                            <ErrorBoundary name="ManagerDashboard">
                              <ManagerDashboardPage />
                            </ErrorBoundary>
                          </PageTransition>
                        </ManagerRoute>
                      </ManagerAuthProvider>
                    } />

                    {/* Staff routes - wrapped in StaffAuthProvider */}
                    <Route path="/staff/login" element={
                      <StaffAuthProvider>
                        <PageTransition animation="slide-up">
                          <StaffLoginPage />
                        </PageTransition>
                      </StaffAuthProvider>
                    } />
                    <Route path="/staff/orders" element={
                      <StaffAuthProvider>
                        <StaffRoute>
                          <PageTransition animation="fade">
                            <ErrorBoundary name="StaffOrderEntry">
                              <StaffOrderEntryPage />
                            </ErrorBoundary>
                          </PageTransition>
                        </StaffRoute>
                      </StaffAuthProvider>
                    } />

                    {/* Error pages */}
                    <Route path="/error/500" element={
                      <PageTransition animation="scale">
                        <ServerErrorPage />
                      </PageTransition>
                    } />
                    <Route path="/error/404" element={
                      <PageTransition animation="scale">
                        <NotFoundPage />
                      </PageTransition>
                    } />

                    {/* Catch all - 404 */}
                    <Route path="*" element={
                      <PageTransition animation="scale">
                        <NotFoundPage />
                      </PageTransition>
                    } />
                  </Routes>
                </Suspense>
              </ErrorBoundary>

              {/* Bottom Navigation (shows on all pages except auth) */}
              <BottomNav />
              
              {/* PWA Components */}
              <InstallPrompt delay={30000} showOnce={true} />
              <OfflineIndicator showPendingCount={true} />
              <UpdatePrompt />
              </AuthProvider>
            </KeyboardShortcutsProvider>
          </ConfirmDialogProvider>
        </ToastProvider>

        {/* Vercel Speed Insights for performance monitoring */}
        <SpeedInsights />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
