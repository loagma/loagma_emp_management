export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {

  const base =
    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
