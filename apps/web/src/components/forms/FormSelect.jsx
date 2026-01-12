import React from 'react';
import './FormInput.css';

const FormSelect = ({
  label,
  name,
  register,
  error,
  required = false,
  disabled = false,
  className = '',
  options = [],
  placeholder = 'Select...',
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
      <select
        id={name}
        className={`form-control ${error ? 'is-invalid' : ''}`}
        disabled={disabled}
        {...register(name)}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div className="form-error-message">
          <span className="error-icon">!</span>
          {error.message}
        </div>
      )}
    </div>
  );
};

export default FormSelect;
