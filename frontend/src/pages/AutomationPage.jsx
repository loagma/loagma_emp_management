import PageLayout from "../components/ui/PageLayout";
import Section from "../components/ui/Section";
import DashboardGrid from "../components/ui/DashboardGrid";
import DashboardSectionCard from "../components/ui/DashboardSectionCard";
import Button from "../components/ui/Button";

export default function AutomationPage() {

  const automations = [
    {
      title: "Task Assignment Notification",
      description: "Send WhatsApp message when task assigned.",
      active: true,
    },
    {
      title: "Deadline Reminder",
      description: "Auto remind employee before deadline.",
      active: true,
    },
    {
      title: "Overdue Escalation",
      description: "Notify manager when task overdue.",
      active: false,
    },
    {
      title: "Performance Summary",
      description: "Weekly performance summary to owner.",
      active: true,
    },
  ];

  return (
    <PageLayout>

      <Section title="Automation Rules">

        <DashboardGrid cols={2}>

          {automations.map((rule, index) => (

            <DashboardSectionCard
              key={index}
              title={rule.title}
              rightContent={
                <label className="inline-flex items-center cursor-pointer">

                  <input
                    type="checkbox"
                    defaultChecked={rule.active}
                    className="sr-only peer"
                  />

                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 relative transition">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5"></div>
                  </div>

                </label>
              }
            >

              <p className="text-sm text-gray-600">
                {rule.description}
              </p>

              <div className="mt-4 flex gap-3">

                <Button variant="secondary">
                  Edit
                </Button>

                <Button variant="secondary">
                  Test
                </Button>

              </div>

            </DashboardSectionCard>

          ))}

        </DashboardGrid>

      </Section>

    </PageLayout>
  );
}
