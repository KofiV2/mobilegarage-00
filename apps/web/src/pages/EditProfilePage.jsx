import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import FormInput from '../components/FormInput';
import { ValidationRules, validateForm, hasErrors, getFirstErrorField } from '../utils/formValidation';
import logger from '../utils/logger';
import './EditProfilePage.css';

const EditProfilePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, updateUserProfile } = useAuth();
  const { showToast } = useToast();

  const isNewUser = location.state?.isNewUser;

  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [validFields, setValidFields] = useState({});
  const [shakeFields, setShakeFields] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for auto-focus
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const fieldRefs = { name: nameRef, email: emailRef };

  // Validation schema
  const validationSchema = {
    name: [ValidationRules.required, ValidationRules.name],
    email: [ValidationRules.email] // Optional, only validated if provided
  };

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || ''
      });
    }
  }, [userData]);

  /**
   * Translate error message
   */
  const translateError = (error) => {
    if (!error) return null;
    if (typeof error === 'string') {
      const translated = t(error);
      return translated !== error ? translated : error;
    }
    if (typeof error === 'object' && error.key) {
      return t(error.key, error.params);
    }
    return error;
  };

  /**
   * Validate a single field
   */
  const validateField = (name, value) => {
    const rules = validationSchema[name];
    if (!rules) return null;
    
    for (const rule of rules) {
      const error = rule(value);
      if (error) return error;
    }
    return null;
  };

  /**
   * Handle field change with real-time validation
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear shake animation
    setShakeFields(prev => ({ ...prev, [name]: false }));
    
    // Real-time validation if field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => {
        if (error) {
          return { ...prev, [name]: error };
        } else {
          const { [name]: _, ...rest } = prev;
          return rest;
        }
      });
      
      // Track valid fields for success checkmark
      setValidFields(prev => ({
        ...prev,
        [name]: !error && value && value.trim().length > 0
      }));
    }
  };

  /**
   * Handle field blur - validate on blur
   */
  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const value = formData[name];
    const error = validateField(name, value);
    
    setErrors(prev => {
      if (error) {
        return { ...prev, [name]: error };
      } else {
        const { [name]: _, ...rest } = prev;
        return rest;
      }
    });
    
    // Track valid fields
    setValidFields(prev => ({
      ...prev,
      [name]: !error && value && value.trim().length > 0
    }));
  };

  /**
   * Trigger shake animation on error fields
   */
  const triggerShake = (fieldNames) => {
    const shakeState = {};
    fieldNames.forEach(name => {
      shakeState[name] = true;
    });
    setShakeFields(shakeState);
    
    // Clear shake after animation
    setTimeout(() => {
      setShakeFields({});
    }, 500);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const formErrors = validateForm(formData, validationSchema);
    setErrors(formErrors);
    
    // Mark all fields as touched
    setTouched({ name: true, email: true });
    
    // Update valid fields
    setValidFields({
      name: !formErrors.name && formData.name && formData.name.trim().length > 0,
      email: !formErrors.email && formData.email && formData.email.trim().length > 0
    });

    if (hasErrors(formErrors)) {
      // Trigger shake on error fields
      triggerShake(Object.keys(formErrors));
      
      // Focus first error field
      const firstErrorField = getFirstErrorField(formErrors, ['name', 'email']);
      if (firstErrorField && fieldRefs[firstErrorField]?.current) {
        setTimeout(() => {
          fieldRefs[firstErrorField].current.focus();
        }, 100);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateUserProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
        emailVerified: false // Reset verification when email changes
      });

      if (result.success) {
        showToast(t('editProfile.updateSuccess') || 'Profile updated successfully!', 'success');
        navigate(isNewUser ? '/' : '/profile');
      } else {
        const errorMessage = result.error || t('editProfile.updateError');
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      logger.error('Unexpected error updating profile', error, { formData });
      const errorMessage = t('editProfile.updateError');
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="edit-profile-page">
      <header className="edit-header">
        {!isNewUser && (
          <button className="back-btn" onClick={() => navigate('/profile')}>
            ← {t('common.back')}
          </button>
        )}
        <h1>{isNewUser ? t('editProfile.welcomeTitle') : t('editProfile.title')}</h1>
        {isNewUser && <p className="welcome-subtitle">{t('editProfile.welcomeSubtitle')}</p>}
      </header>

      <form onSubmit={handleSubmit} className="edit-form" noValidate>
        <FormInput
          ref={nameRef}
          name="name"
          label={t('editProfile.fullName')}
          type="text"
          value={formData.name}
          onChange={handleChange}
          onBlur={() => handleBlur('name')}
          placeholder={t('editProfile.fullNamePlaceholder')}
          required
          autoFocus={isNewUser}
          error={touched.name ? translateError(errors.name) : null}
          success={validFields.name}
          shake={shakeFields.name}
        />

        <FormInput
          ref={emailRef}
          name="email"
          label={t('editProfile.email')}
          type="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={() => handleBlur('email')}
          placeholder={t('editProfile.emailPlaceholder')}
          hint={t('editProfile.emailHint')}
          error={touched.email ? translateError(errors.email) : null}
          success={validFields.email}
          shake={shakeFields.email}
        />

        <button
          type="submit"
          className="save-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('common.saving') : (isNewUser ? t('editProfile.getStarted') : t('common.save'))}
        </button>
      </form>
    </div>
  );
};

export default EditProfilePage;
