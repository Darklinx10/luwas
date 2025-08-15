import React from 'react';

const InputField = ({
  id,
  value,
  onChange,
  type = 'text',
  autoComplete,
  placeholder,
  disabled = false,
  required = false,
}) => {
  return (
    <input
      id={id}
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={`w-full border rounded px-3 py-2 ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
      } focus:outline-none focus:ring-2 focus:ring-green-500`}
    />
  );
};

export default InputField;
