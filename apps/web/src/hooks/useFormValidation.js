import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { validateField, validateForm, hasErrors, getFirstErrorField } from '../utils/formValidation';

/**
 * useFormValidation Hook
 * 
 * Enhanced form validation with:
 * - Real-time validation as user types
 * - Bilingual error messages
 * - Shake animation trigger on invalid submit
 * - Auto-focus first error field
 * - Success state tracking
 * 
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationSchema - Validation rules per field
 * @param {Object} options - Additional options
 * @returns {Object} Form state and handlers
 */
export function useFormValidation(initialValues = {}, validationSchema = {}, options = {}) {
  const { t } = useTranslation();
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300,
  } = options;

  // Form values
  const [values, setValues] = useState(initialValues);
  
  // Field-level errors (using i18n keys)
  const [errors, setErrors] = useState({});
  
  // Touched fields
  const [touched, setTouched] = useState({});
  
  // Valid fields (for success checkmark)
  const [validFields, setValidFields] = useState({});
  
  // Shake animation state
  const [shakeFields, setShakeFields] = useState({});
  
  // Debounce timers
  const debounceTimers = useRef({});
  
  // Form refs for auto-focus
  const fieldRefs = useRef({});

  /**
   * Register a field ref for auto-focus
   */
  const registerField = useCallback((name, ref) => {
    if (ref) {
      fieldRefs.current[name] = ref;
    }
  }, []);

  /**
   * Translate error message (handles both string keys and objects with params)
   */
  const translateError = useCallback((error) => {
    if (!error) return null;
    
    if (typeof error === 'string') {
      return t(error);
    }
    
    if (typeof error === 'object' && error.key) {
      return t(error.key, error.params);
    }
    
    return error;
  }, [t]);

  /**
   * Validate a single field
   */
  const validateSingleField = useCallback((name, value) => {
    const rules = validationSchema[name];
    if (!rules) return null;
    
    const error = validateField(value, rules);
    
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
      [name]: !error && value && value.toString().trim().length > 0
    }));
    
    return error;
  }, [validationSchema]);

  /**
   * Handle field change with optional debounced validation
   */
  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear shake animation
    setShakeFields(prev => ({ ...prev, [name]: false }));
    
    if (validateOnChange && touched[name]) {
      // Clear existing debounce timer
      if (debounceTimers.current[name]) {
        clearTimeout(debounceTimers.current[name]);
      }
      
      // Set new debounce timer
      debounceTimers.current[name] = setTimeout(() => {
        validateSingleField(name, value);
      }, debounceMs);
    }
  }, [validateOnChange, touched, debounceMs, validateSingleField]);

  /**
   * Handle field blur
   */
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (validateOnBlur) {
      // Clear debounce timer and validate immediately
      if (debounceTimers.current[name]) {
        clearTimeout(debounceTimers.current[name]);
      }
      validateSingleField(name, values[name]);
    }
  }, [validateOnBlur, validateSingleField, values]);

  /**
   * Trigger shake animation on fields with errors
   */
  const triggerShake = useCallback((fieldNames) => {
    const shakeState = {};
    fieldNames.forEach(name => {
      shakeState[name] = true;
    });
    setShakeFields(shakeState);
    
    // Clear shake after animation
    setTimeout(() => {
      setShakeFields({});
    }, 500);
  }, []);

  /**
   * Focus first error field
   */
  const focusFirstError = useCallback((fieldOrder = null) => {
    const firstErrorField = getFirstErrorField(errors, fieldOrder);
    if (firstErrorField && fieldRefs.current[firstErrorField]) {
      fieldRefs.current[firstErrorField].focus();
    }
  }, [errors]);

  /**
   * Validate all fields and return success status
   */
  const validateAll = useCallback((fieldOrder = null) => {
    const formErrors = validateForm(values, validationSchema);
    setErrors(formErrors);
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(validationSchema).forEach(name => {
      allTouched[name] = true;
    });
    setTouched(allTouched);
    
    // Update valid fields
    const valid = {};
    Object.keys(validationSchema).forEach(name => {
      valid[name] = !formErrors[name] && values[name] && values[name].toString().trim().length > 0;
    });
    setValidFields(valid);
    
    if (hasErrors(formErrors)) {
      // Trigger shake on error fields
      triggerShake(Object.keys(formErrors));
      
      // Focus first error field
      const firstErrorField = getFirstErrorField(formErrors, fieldOrder);
      if (firstErrorField && fieldRefs.current[firstErrorField]) {
        setTimeout(() => {
          fieldRefs.current[firstErrorField].focus();
        }, 100);
      }
      
      return false;
    }
    
    return true;
  }, [values, validationSchema, triggerShake]);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setValidFields({});
    setShakeFields({});
  }, [initialValues]);

  /**
   * Set form values (useful for edit forms)
   */
  const setFormValues = useCallback((newValues) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  /**
   * Get field props for easy binding to FormInput
   */
  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] || '',
    onChange: (e) => handleChange(name, e.target.value),
    onBlur: () => handleBlur(name),
    error: touched[name] ? translateError(errors[name]) : null,
    success: validFields[name] || false,
    shake: shakeFields[name] || false,
    ref: (el) => registerField(name, el),
  }), [values, touched, errors, validFields, shakeFields, handleChange, handleBlur, translateError, registerField]);

  return {
    // State
    values,
    errors,
    touched,
    validFields,
    shakeFields,
    
    // Handlers
    handleChange,
    handleBlur,
    validateAll,
    validateSingleField,
    resetForm,
    setFormValues,
    
    // Helpers
    getFieldProps,
    registerField,
    translateError,
    focusFirstError,
    
    // Computed
    isValid: !hasErrors(errors),
    isDirty: Object.keys(touched).length > 0,
  };
}

export default useFormValidation;
