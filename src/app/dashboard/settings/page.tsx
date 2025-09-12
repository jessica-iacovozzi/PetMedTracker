import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import AccountSettings from "@/components/account-settings";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user profile data
  const { data: userProfile } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get notification preferences (if they exist)
  const { data: notificationPrefs } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get subscription data
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8">
          <AccountSettings
            user={user}
            userProfile={userProfile}
            notificationPrefs={notificationPrefs}
            subscription={subscription}
          />
        </div>
      </main>
    </>
  );
}
