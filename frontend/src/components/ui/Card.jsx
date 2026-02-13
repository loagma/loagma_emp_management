export default function Card({ children, className = "" }) {
  return (
    <div
      className={`
        bg-white
        rounded-xl
        border border-gray-100
        p-6
        shadow-sm
        transition-all duration-200
        hover:shadow-md
        hover:-translate-y-[2px]
        ${className}
      `}
    >
      {children}
    </div>
  );
}
