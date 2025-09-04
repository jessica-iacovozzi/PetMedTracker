import DashboardNavbar from "@/components/dashboard-navbar";
import DashboardOverview from "@/components/dashboard-overview";
import { createClient } from "../../../supabase/server";
import { InfoIcon, UserCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import { getTodaysRemindersAction } from "@/app/actions";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get today's reminders
  const remindersResult = await getTodaysRemindersAction();
  const todaysReminders = remindersResult.success ? remindersResult.data : [];

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="w-full">
        <DashboardOverview todaysReminders={todaysReminders} />
      </main>
    </SubscriptionCheck>
  );
}
