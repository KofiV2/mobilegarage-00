import React, { useState, useEffect, useId } from 'react';
import PropTypes from 'prop-types';
import { validateField } from '../utils/formValidation';
import './FormInput.css';

/**
 * FormInput Component
 *
 * Reusable form input with built-in validation, error display, and accessibility.
 *
 * Features:
 * - Real-time validation
 * - Field-level error messages
 * - Success/error states with icons
 * - Accessibility (ARIA attributes)
 * - Optional character counter
 * - Debounced validation
 *
 * Usage:
 * <FormInput
 *   name="email"
 *   label="Email Address"
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   validationRules={[ValidationRules.required, ValidationRules.email]}
 *   required
 * />
 */

const FormInput = ({
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  validationRules = [],
  placeholder,
  hint,
  required = false,
  disabled = false,
  autoFocus = false,
  maxLength,
  showCharCount = false,
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
  className = '',
  inputClassName = '',
  error: externalError,
  success,
  icon,
  ...rest
}) => {
  // Generate unique IDs for accessibility
  const uniqueId = useId();
  const inputId = `${name}-${uniqueId}`;
  const errorId = `${name}-error-${uniqueId}`;
  const hintId = `${name}-hint-${uniqueId}`;

  const [internalError, setInternalError] = useState(null);
  const [touched, setTouched] = useState(false);
  const [validationTimeout, setValidationTimeout] = useState(null);

  const error = externalError || internalError;
  const showError = touched && error;

  // Validate field
  const validate = (fieldValue) => {
    if (validationRules.length === 0) return;

    const validationError = validateField(fieldValue, validationRules);
    setInternalError(validationError);
  };

  // Handle change with optional debounced validation
  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(e);

    if (validateOnChange && touched) {
      if (debounceMs > 0) {
        // Clear existing timeout
        if (validationTimeout) {
          clearTimeout(validationTimeout);
        }

        // Set new timeout
        const timeout = setTimeout(() => {
          validate(newValue);
        }, debounceMs);

        setValidationTimeout(timeout);
      } else {
        validate(newValue);
      }
    }
  };

  // Handle blur
  const handleBlur = (e) => {
    setTouched(true);

    if (validateOnBlur) {
      validate(e.target.value);
    }

    if (onBlur) {
      onBlur(e);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  // Get input state class
  const getStateClass = () => {
    if (showError) return 'has-error';
    if (success) return 'has-success';
    return '';
  };

  // Build aria-describedby based on what's visible
  const getAriaDescribedBy = () => {
    const ids = [];
    if (showError) ids.push(errorId);
    else if (hint) ids.push(hintId);
    return ids.length > 0 ? ids.join(' ') : undefined;
  };

  // Character count
  const charCount = value?.length || 0;
  const showCount = showCharCount && maxLength;

  return (
    <div className={`form-input-wrapper ${className}`}>
      {/* Label */}
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="required-indicator" aria-hidden="true">*</span>}
          {required && <span className="sr-only">(required)</span>}
        </label>
      )}

      {/* Input Container */}
      <div className={`input-container ${getStateClass()}`}>
        {/* Icon (left) */}
        {icon && <span className="input-icon-left" aria-hidden="true">{icon}</span>}

        {/* Input */}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          maxLength={maxLength}
          required={required}
          className={`form-input ${inputClassName} ${icon ? 'has-icon' : ''}`}
          aria-invalid={showError ? 'true' : undefined}
          aria-describedby={getAriaDescribedBy()}
          {...rest}
        />

        {/* Status Icon (right) */}
        {showError && (
          <span className="input-icon-right error-icon" aria-hidden="true">
            ⚠️
          </span>
        )}
        {success && !showError && (
          <span className="input-icon-right success-icon" aria-hidden="true">
            ✓
          </span>
        )}
      </div>

      {/* Error Message - uses role="alert" for immediate announcement */}
      {showError && (
        <p className="input-error" id={errorId} role="alert" aria-live="assertive">
          {error}
        </p>
      )}

      {/* Hint Text */}
      {hint && !showError && (
        <p className="input-hint" id={hintId}>{hint}</p>
      )}

      {/* Character Count */}
      {showCount && (
        <p 
          className={`char-count ${charCount > maxLength * 0.9 ? 'warning' : ''}`}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="sr-only">Character count: </span>
          {charCount} / {maxLength}
          {charCount > maxLength * 0.9 && (
            <span className="sr-only"> - approaching limit</span>
          )}
        </p>
      )}
    </div>
  );
};

FormInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  validationRules: PropTypes.arrayOf(PropTypes.func),
  placeholder: PropTypes.string,
  hint: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  autoFocus: PropTypes.bool,
  maxLength: PropTypes.number,
  showCharCount: PropTypes.bool,
  validateOnChange: PropTypes.bool,
  validateOnBlur: PropTypes.bool,
  debounceMs: PropTypes.number,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  error: PropTypes.string,
  success: PropTypes.bool,
  icon: PropTypes.node
};

export default FormInput;
