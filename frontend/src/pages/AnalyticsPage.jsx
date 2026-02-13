import { useState, useEffect } from "react";
import { getAnalyticsSummary, getAnalyticsTrends } from "../features/analytics/api/analyticsApi";
import { fetchEmployees } from "../features/employees/api/employeeApi";
import toast from "react-hot-toast";
import PageLayout from "../components/ui/PageLayout";
import Section from "../components/ui/Section";
import DashboardGrid from "../components/ui/DashboardGrid";
import DashboardSectionCard from "../components/ui/DashboardSectionCard";
import MetricCard from "../components/cards/MetricCard";
import Skeleton from "../components/ui/Skeleton";
import Button from "../components/ui/Button";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [summaryData, trendsData, employeesData] = await Promise.all([
        getAnalyticsSummary(),
        getAnalyticsTrends(period),
        fetchEmployees(),
      ]);
      setSummary(summaryData);
      setTrends(trendsData);
      setEmployees(employeesData.results || employeesData);
    } catch (error) {
      console.error("Failed to load analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* KPI Metrics */}
      <Section title="Performance Analytics">
        <DashboardGrid cols={4}>
          <MetricCard
            title="Total Tasks"
            value={summary?.total_tasks || 0}
          />
          <MetricCard
            title="Completion Rate"
            value={`${summary?.completion_rate?.toFixed(1) || 0}%`}
          />
          <MetricCard
            title="Avg Completion Time"
            value={`${summary?.avg_completion_time_days?.toFixed(1) || 0} Days`}
          />
          <MetricCard
            title="Efficiency Score"
            value={`${summary?.efficiency_score?.toFixed(0) || 0}/100`}
          />
        </DashboardGrid>
      </Section>

      {/* Period Selector */}
      <div className="flex justify-end gap-2 mb-4">
        <Button
          variant={period === "7d" ? "primary" : "secondary"}
          onClick={() => setPeriod("7d")}
        >
          7 Days
        </Button>
        <Button
          variant={period === "30d" ? "primary" : "secondary"}
          onClick={() => setPeriod("30d")}
        >
          30 Days
        </Button>
        <Button
          variant={period === "90d" ? "primary" : "secondary"}
          onClick={() => setPeriod("90d")}
        >
          90 Days
        </Button>
      </div>

      {/* Charts Section */}
      <DashboardGrid cols={3}>
        <DashboardSectionCard
          title="Performance Trends"
          rightContent={`Last ${period}`}
          className="lg:col-span-2"
        >
          <div className="h-[300px] bg-gray-50 rounded-lg p-4">
            {trends?.trends?.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-4">
                  Daily task activity over the selected period
                </p>
                <div className="grid grid-cols-7 gap-2 text-xs">
                  {trends.trends.slice(0, 7).map((day, index) => (
                    <div key={index} className="text-center">
                      <div className="bg-blue-100 rounded p-2 mb-1">
                        <p className="font-semibold text-blue-600">
                          {day.created}
                        </p>
                        <p className="text-gray-500">Created</p>
                      </div>
                      <div className="bg-green-100 rounded p-2">
                        <p className="font-semibold text-green-600">
                          {day.completed}
                        </p>
                        <p className="text-gray-500">Done</p>
                      </div>
                      <p className="mt-1 text-gray-400">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No trend data available
              </div>
            )}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard title="Key Metrics">
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">On-Time Completion</p>
              <p className="text-2xl font-bold text-blue-600">
                {summary?.on_time_completion_rate?.toFixed(1) || 0}%
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {summary?.completion_rate?.toFixed(1) || 0}%
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Efficiency Score</p>
              <p className="text-2xl font-bold text-purple-600">
                {summary?.efficiency_score?.toFixed(0) || 0}/100
              </p>
            </div>
          </div>
        </DashboardSectionCard>
      </DashboardGrid>

      {/* Employee Performance
    <Section title="Team Members">
        <DashboardGrid cols={3}>
          {employees.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-gray-500">
              No employees found
            </div>
          ) : (
            employees.slice(0, 6).map((emp) => (
              <DashboardSectionCard key={emp.id} title={emp.username}>
                <div className="space-y-2 text-sm">
                  <p>
                    Role:{" "}
                    <span className="font-semibold">{emp.role_display}</span>
                  </p>
                  <p>
                    Email: <span className="font-semibold">{emp.email}</span>
                  </p>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      Click to view detailed performance
                    </p>
                  </div>
                </div>
              </DashboardSectionCard>
            ))
          )}
        </DashboardGrid>
      </Section> */}
    </PageLayout>
  );
}
