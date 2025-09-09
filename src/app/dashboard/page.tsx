import DashboardNavbar from "@/components/dashboard-navbar";
import DashboardOverview from "@/components/dashboard-overview";
import { createClient } from "../../../supabase/server";
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

  // Check if user has completed onboarding (has pets)
  const { data: pets } = await supabase
    .from("pets")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  // If no pets, redirect to onboarding
  if (!pets || pets.length === 0) {
    return redirect("/onboarding");
  }

  // Get today's reminders and all pets
  const [remindersResult, allPets] = await Promise.all([
    getTodaysRemindersAction(),
    getPets(user.id),
  ]);

  const todaysReminders = remindersResult.success ? remindersResult.data : [];

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="w-full">
        <DashboardOverview pets={allPets} todaysReminders={todaysReminders} />
      </main>
    </SubscriptionCheck>
  );
}
