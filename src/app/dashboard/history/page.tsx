import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import HistoryLog from "@/components/history-log";
import { getHistoryAction, getPets } from "@/app/actions";

export default async function HistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  try {
    const [historyResult, pets] = await Promise.all([
      getHistoryAction(),
      getPets(user.id),
    ]);

    if (historyResult.error) {
      throw new Error(historyResult.error);
    }

    const historyData = historyResult.data || [];

    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Medication History
            </h1>
            <p className="text-gray-600">
              Track your pet&apos;s medication administration history
            </p>
          </div>

          <HistoryLog
            initialHistory={historyData}
            pets={pets}
            userId={user.id}
          />
        </main>
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Error Loading History
            </h1>
            <p className="text-gray-600">
              Unable to load medication history. Please try again later.
            </p>
          </div>
        </main>
      </div>
    );
  }
}
