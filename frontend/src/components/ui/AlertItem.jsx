export default function AlertItem({
  title,
  description,
  type = "warning"
}) {

  const colors = {
    danger: "bg-red-50 border-red-200 text-red-700",
    warning: "bg-orange-50 border-orange-200 text-orange-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  };

  return (
    <div className={`border rounded-lg p-4 ${colors[type]}`}>
      <p className="font-medium">{title}</p>
      <p className="text-sm mt-1 opacity-80">
        {description}
      </p>
    </div>
  );
}
