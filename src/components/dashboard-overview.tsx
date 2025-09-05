"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Bell,
  Calendar,
  Heart,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import PetCard from "./pet-card";
import ReminderCard from "./reminder-card";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DashboardOverviewProps {
  pets?: any[];
  todaysReminders?: any[];
}

export default function DashboardOverview({
  pets = [],
  todaysReminders = [],
}: DashboardOverviewProps) {
  const router = useRouter();
  const totalPets = pets.length;
  const totalMedications = pets.reduce(
    (acc, pet) => acc + (pet.medications?.length || 0),
    0,
  );

  // Calculate different reminder statuses
  const now = new Date();
  const pendingReminders = todaysReminders.filter(
    (reminder) => reminder.status === "pending",
  );

  const overdueReminders = pendingReminders.filter((reminder) => {
    const scheduledTime = new Date(reminder.scheduled_time);
    return now > scheduledTime;
  });

  const upcomingReminders = pendingReminders.filter((reminder) => {
    const scheduledTime = new Date(reminder.scheduled_time);
    const timeDiff = scheduledTime.getTime() - now.getTime();
    return timeDiff > 0 && timeDiff <= 2 * 60 * 60 * 1000; // Next 2 hours
  });

  const givenReminders = todaysReminders.filter(
    (reminder) => reminder.status === "given",
  );

  const missedReminders = todaysReminders.filter(
    (reminder) => reminder.status === "missed",
  );

  // Group reminders by time periods
  const groupRemindersByTime = (reminders: any[]) => {
    const morning = reminders.filter((r) => {
      const hour = new Date(r.scheduled_time).getHours();
      return hour >= 6 && hour < 12;
    });
    const afternoon = reminders.filter((r) => {
      const hour = new Date(r.scheduled_time).getHours();
      return hour >= 12 && hour < 18;
    });
    const evening = reminders.filter((r) => {
      const hour = new Date(r.scheduled_time).getHours();
      return hour >= 18 || hour < 6;
    });
    return { morning, afternoon, evening };
  };

  const groupedReminders = groupRemindersByTime(todaysReminders);

  return (
    <div className="w-full max-w-6xl mx-auto bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage your pets' medication schedules
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/pets">
              <Plus className="w-4 h-4 mr-2" />
              Add Pet
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/medications">
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/pricing">Upgrade to Premium</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pets</p>
                <p className="text-2xl font-bold text-gray-900">{totalPets}</p>
              </div>
              <Heart className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Medications
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalMedications}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {overdueReminders.length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Upcoming (2hrs)
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {upcomingReminders.length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Banners */}
      {overdueReminders.length > 0 && (
        <Card className="bg-red-50 border-red-200 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">
                    {overdueReminders.length} medication
                    {overdueReminders.length > 1 ? "s" : ""} overdue!
                  </p>
                  <p className="text-sm text-red-700">
                    These medications are past their scheduled time.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {upcomingReminders.length > 0 && overdueReminders.length === 0 && (
        <Card className="bg-orange-50 border-orange-200 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">
                    {upcomingReminders.length} medication
                    {upcomingReminders.length > 1 ? "s" : ""} due soon
                  </p>
                  <p className="text-sm text-orange-700">
                    Prepare for upcoming doses in the next 2 hours.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Medication Schedule */}
      {todaysReminders.length > 0 ? (
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Today's Medication Schedule
            </h2>
            <div className="flex gap-2">
              <Badge variant="secondary">{todaysReminders.length} total</Badge>
              <Badge className="bg-green-100 text-green-800">
                {givenReminders.length} given
              </Badge>
              {pendingReminders.length > 0 && (
                <Badge className="bg-blue-100 text-blue-800">
                  {pendingReminders.length} pending
                </Badge>
              )}
            </div>
          </div>

          {/* Group by time periods */}
          {Object.entries(groupedReminders).map(([period, reminders]) => {
            if (reminders.length === 0) return null;

            return (
              <div key={period} className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 capitalize flex items-center gap-2">
                  {period === "morning" && <span>🌅</span>}
                  {period === "afternoon" && <span>☀️</span>}
                  {period === "evening" && <span>🌙</span>}
                  {period} ({reminders.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reminders.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onMarkAsGiven={() => router.refresh()}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="bg-white border border-gray-200 mb-8">
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No medications due today!
            </h3>
            <p className="text-gray-600 mb-6">
              Your pets are all set for today. Great job staying on top of their
              care!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pets Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Your Pets</h2>
          <Badge variant="secondary">
            {totalPets} pet{totalPets !== 1 ? "s" : ""}
          </Badge>
        </div>

        {pets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        ) : (
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-12 text-center">
              <Heart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No pets added yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start by adding your first pet to track their medications.
              </p>
              <Button asChild>
                <Link href="/dashboard/pets">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Pet
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
