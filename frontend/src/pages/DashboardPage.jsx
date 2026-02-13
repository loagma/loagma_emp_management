import { useState, useEffect } from "react";
import { getDashboardStats, getDashboardAlerts } from "../features/dashboard/api/dashboardApi";
import { getAnalyticsTrends } from "../features/analytics/api/analyticsApi";
import toast from "react-hot-toast";
import MetricCard from "../components/cards/MetricCard";
import AlertItem from "../components/ui/AlertItem";
import Section from "../components/ui/Section";
import PageLayout from "../components/ui/PageLayout";
import DashboardGrid from "../components/ui/DashboardGrid";
import DashboardSectionCard from "../components/ui/DashboardSectionCard";
import DashboardSkeleton from "../components/ui/DashboardSkeleton";
import PerformanceChart from "../components/charts/PerformanceChart";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [trendsData, setTrendsData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, alertsData, trendsResponse] = await Promise.all([
        getDashboardStats(),
        getDashboardAlerts(),
        getAnalyticsTrends("30d"),
      ]);
      setStats(statsData);
      setAlerts(alertsData);
      setTrendsData(trendsResponse.trends || []);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      toast.error("Failed to load dashboard data");
      // Set default empty data so dashboard still renders
      setStats({
        total_tasks: 0,
        completed_tasks: 0,
        pending_tasks: 0,
        overdue_tasks: 0,
      });
      setAlerts({
        overdue_tasks: [],
        delayed_tasks: [],
      });
      setTrendsData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <PageLayout>

      {/* Overview Section */}
      <Section title="Overview">

        <DashboardGrid cols={4}>

          <MetricCard
            title="Total Tasks"
            value={stats?.total_tasks || 0}
          />

          <MetricCard
            title="Completed"
            value={stats?.completed_tasks || 0}
          />

          <MetricCard
            title="Pending"
            value={stats?.pending_tasks || 0}
          />

          <MetricCard
            title="Overdue Tasks"
            value={stats?.overdue_tasks || 0}
          />

        </DashboardGrid>

      </Section>


      {/* Chart + Risk Layout */}
      <DashboardGrid cols={3}>

        {/* Analytics Section */}
        <DashboardSectionCard
          title="Performance Analytics"
          rightContent="Last 30 Days"
          className="lg:col-span-2"
        >
          <div className="h-[260px]">
            <PerformanceChart data={trendsData} type="line" />
          </div>
        </DashboardSectionCard>


        {/* Attention Required Panel */}
        <DashboardSectionCard title="Attention Required">

          <div className="space-y-3">

            {alerts?.overdue_tasks?.length === 0 && alerts?.delayed_tasks?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No alerts at this time</p>
            ) : (
              <>
                {alerts?.overdue_tasks?.slice(0, 3).map((task) => (
                  <AlertItem
                    key={task.id}
                    type="danger"
                    title={task.title}
                    description={`Assigned to ${task.assigned_to_user?.username} - ${task.priority_display} priority`}
                  />
                ))}
                {alerts?.delayed_tasks?.slice(0, 3).map((task) => (
                  <AlertItem
                    key={task.id}
                    type="warning"
                    title={task.title}
                    description={`Assigned to ${task.assigned_to_user?.username} - Delayed`}
                  />
                ))}
              </>
            )}

          </div>

        </DashboardSectionCard>

      </DashboardGrid>

    </PageLayout>
  );
}
