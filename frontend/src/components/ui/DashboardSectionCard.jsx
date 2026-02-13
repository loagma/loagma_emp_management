import Card from "./Card";
import DashboardCardHeader from "./DashboardCardHeader";

export default function DashboardSectionCard({
  title,
  rightContent,
  children,
  className = ""
}) {
  return (
    <Card className={className}>

      <DashboardCardHeader
        title={title}
        rightContent={rightContent}
      />

      {children}

    </Card>
  );
}
