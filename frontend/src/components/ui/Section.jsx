export default function Section({
  title,
  rightContent,
  children
}) {
  return (
    <div className="space-y-4">

      {/* Section Header */}
      <div className="flex items-center justify-between">

        <h2 className="text-lg font-semibold">
          {title}
        </h2>

        {rightContent && (
          <div>
            {rightContent}
          </div>
        )}

      </div>

      {/* Section Content */}
      <div>
        {children}
      </div>

    </div>
  );
}
