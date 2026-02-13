import Card from "../ui/Card";

export default function MetricCard({
  title,
  value,
  change,
  icon
}) {

  // Detect positive or negative trend
  const trendColor =
    change && change.includes("-")
      ? "text-red-500"
      : "text-green-600";

  return (
    <Card className="relative overflow-hidden">

      {/* Accent bar */}
      <div className="absolute left-0 top-0 h-full w-1 bg-blue-500"></div>

      <div className="pl-3">

        {/* Header */}
        <div className="flex justify-between items-center">

          <p className="text-sm text-gray-500">
            {title}
          </p>

          {icon && (
            <div className="text-gray-400">
              {icon}
            </div>
          )}

        </div>

        {/* Value */}
        <h2 className="text-3xl font-bold tracking-tight mt-2">
          {value}
        </h2>

        {/* Change indicator */}
        {change && (
          <p className={`text-sm mt-2 ${trendColor}`}>
            {change}
          </p>
        )}

      </div>

    </Card>
  );
}
