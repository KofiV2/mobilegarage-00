import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import LanguageSwitcher from '../components/LanguageSwitcher';
import LoadingSpinner from '../components/LoadingSpinner';
import { showErrorNotification, showSuccessNotification } from '../components/ErrorNotification';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showErrorNotification(t('auth.fillAllFields'));
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      showSuccessNotification(t('auth.loginSuccess'));

      // Get user data from localStorage (just set by login function)
      const userData = JSON.parse(localStorage.getItem('user'));

      // Redirect based on user role
      if (userData?.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (userData?.role === 'staff') {
        navigate('/staff/dashboard');
      } else {
        navigate('/'); // Customer home
      }
    } else {
      showErrorNotification(result.error || t('auth.loginFailed'));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">{t('app.name')}</h1>
          <LanguageSwitcher />
        </div>
        <h2 className="auth-subtitle">{t('auth.welcomeBack')}</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? t('auth.loggingIn') : t('auth.login')}
          </button>

          <p className="auth-link">
            {t('auth.dontHaveAccount')} <Link to="/register">{t('auth.signup')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
