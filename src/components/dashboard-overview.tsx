import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Bell, Calendar, Heart, Plus, Clock, CheckCircle2 } from "lucide-react";
import PetCard from "./pet-card";
import ReminderCard from "./reminder-card";

interface DashboardOverviewProps {
  pets?: any[];
  todaysReminders?: any[];
}

export default function DashboardOverview({
  pets = [
    {
      id: "1",
      name: "Buddy",
      species: "Dog",
      photo:
        "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&q=80",
      medications: [
        {
          id: "1",
          name: "Heartgard Plus",
          dosage: "1 tablet",
          nextDose: "2:00 PM",
          status: "due",
        },
        {
          id: "2",
          name: "Apoquel",
          dosage: "16mg",
          nextDose: "6:00 PM",
          status: "upcoming",
        },
      ],
    },
    {
      id: "2",
      name: "Whiskers",
      species: "Cat",
      photo:
        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80",
      medications: [
        {
          id: "3",
          name: "Flea Treatment",
          dosage: "1 application",
          nextDose: "Tomorrow 9:00 AM",
          status: "upcoming",
        },
      ],
    },
  ],
  todaysReminders = [],
}: DashboardOverviewProps) {
  const totalPets = pets.length;
  const totalMedications = pets.reduce(
    (acc, pet) => acc + pet.medications.length,
    0,
  );
  const dueMedications = todaysReminders.filter(
    (reminder) => reminder.status === "pending",
  ).length;
  const dueReminders = todaysReminders.filter((reminder) => {
    const now = new Date();
    const scheduledTime = new Date(reminder.scheduled_time);
    return (
      Math.abs(now.getTime() - scheduledTime.getTime()) < 30 * 60 * 1000 &&
      reminder.status === "pending"
    );
  }).length;

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
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Pet
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Medication
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
                <p className="text-sm font-medium text-gray-600">Due Now</p>
                <p className="text-2xl font-bold text-red-600">
                  {dueReminders}
                </p>
              </div>
              <Clock className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Today's Reminders
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {todaysReminders.length}
                </p>
              </div>
              <Bell className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Banner */}
      {dueReminders > 0 && (
        <Card className="bg-red-50 border-red-200 mb-8">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">
                    {dueReminders} medication{dueReminders > 1 ? "s" : ""} due
                    now!
                  </p>
                  <p className="text-sm text-red-700">
                    Don't forget to give your pets their scheduled medications.
                  </p>
                </div>
              </div>
              <Button size="sm" className="bg-red-600 hover:bg-red-700">
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Reminders */}
      {todaysReminders.length > 0 && (
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Today's Reminders
            </h2>
            <Badge variant="secondary">
              {todaysReminders.length} reminder
              {todaysReminders.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaysReminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))}
          </div>
        </div>
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
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Pet
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
