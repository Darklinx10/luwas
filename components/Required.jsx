// components/RequiredField.jsx
export default function RequiredField({ htmlFor, label, children, required, showError }) {
  return (
    <div className="flex flex-col">
      {/* Label with red asterisk */}
      <label htmlFor={htmlFor} className="mb-1 text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Field */}
      {children}

      {/* Error text */}
      {required && showError && (
        <span className="text-red-500 text-xs mt-1">* Required</span>
      )}
    </div>
  );
}
