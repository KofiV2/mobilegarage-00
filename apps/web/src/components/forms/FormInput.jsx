import React from 'react';
import './FormInput.css';

const FormInput = ({
  label,
  name,
  type = 'text',
  register,
  error,
  required = false,
  placeholder,
  disabled = false,
  className = '',
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
      <input
        id={name}
        type={type}
        className={`form-control ${error ? 'is-invalid' : ''}`}
        placeholder={placeholder}
        disabled={disabled}
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

export default FormInput;
