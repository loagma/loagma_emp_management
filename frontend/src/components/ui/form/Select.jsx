export default function Select({
  label,
  children,
  ...props
}) {
  return (
    <div className="space-y-1">

      {label && (
        <label className="text-sm text-gray-600">
          {label}
        </label>
      )}

      <select
        {...props}
        className="
          w-full
          border
          rounded-lg
          px-3 py-2
          text-sm
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
        "
      >
        {children}
      </select>

    </div>
  );
}
