import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './i18n';
import './rtl.css';
import './theme.css';
import './styles/animations.css';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import { ConfirmDialogProvider } from './components/ConfirmDialog';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransition from './components/PageTransition';

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
                  <Route path="/" element={
                    <PageTransition animation="fade">
                      <LandingPage />
                    </PageTransition>
                  } />
                  <Route path="/auth" element={
                    <PageTransition animation="slide-up">
                      <AuthPage />
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
                    <ProtectedRoute>
                      <PageTransition animation="fade">
                        <ErrorBoundary name="Track">
                          <TrackPage />
                        </ErrorBoundary>
                      </PageTransition>
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <PageTransition animation="slide-left">
                        <ErrorBoundary name="Profile">
                          <ProfilePage />
                        </ErrorBoundary>
                      </PageTransition>
                    </ProtectedRoute>
                  } />
                  <Route path="/profile/edit" element={
                    <ProtectedRoute>
                      <PageTransition animation="slide-up">
                        <ErrorBoundary name="EditProfile">
                          <EditProfilePage />
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
