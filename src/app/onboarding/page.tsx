import { createClient } from "../../../supabase/server";
import { redirect } from "next/navigation";
import OnboardingFlow from "@/components/onboarding-flow";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Check if user has already completed onboarding
  const { data: pets } = await supabase
    .from("pets")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  // If user has pets, they've likely completed onboarding
  if (pets && pets.length > 0) {
    return redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <OnboardingFlow />
    </div>
  );
}
