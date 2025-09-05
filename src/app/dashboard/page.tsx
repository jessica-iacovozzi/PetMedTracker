import DashboardNavbar from "@/components/dashboard-navbar";
import DashboardOverview from "@/components/dashboard-overview";
import { createClient } from "../../../supabase/server";
import { InfoIcon, UserCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import { getTodaysRemindersAction, getPets } from "@/app/actions";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get today's reminders and pets
  const [remindersResult, pets] = await Promise.all([
    getTodaysRemindersAction(),
    getPets(user.id),
  ]);

  const todaysReminders = remindersResult.success ? remindersResult.data : [];

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="w-full">
        <DashboardOverview pets={pets} todaysReminders={todaysReminders} />
      </main>
    </SubscriptionCheck>
  );
}
