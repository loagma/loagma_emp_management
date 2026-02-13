export default function DashboardGrid({
  children,
  cols = 3
}) {

  const gridMap = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid gap-6 ${gridMap[cols]}`}>
      {children}
    </div>
  );
}
