import React from 'react';
import './FormInput.css';

const FormTextarea = ({
  label,
  name,
  register,
  error,
  required = false,
  placeholder,
  disabled = false,
  className = '',
  rows = 4,
  ...rest
}) => {
  return (
    <div className={`form-input-group ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      <textarea
        id={name}
        className={`form-control ${error ? 'is-invalid' : ''}`}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        {...register(name)}
        {...rest}
      />
      {error && (
        <div className="form-error-message">
          <span className="error-icon">!</span>
          {error.message}
        </div>
      )}
    </div>
  );
};

export default FormTextarea;
