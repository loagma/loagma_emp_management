export default function DashboardCardHeader({
  title,
  rightContent
}) {
  return (
    <div className="flex justify-between items-center mb-6">

      <h2 className="text-lg font-semibold">
        {title}
      </h2>

      {rightContent && (
        <div className="text-sm text-gray-500">
          {rightContent}
        </div>
      )}

    </div>
  );
}
