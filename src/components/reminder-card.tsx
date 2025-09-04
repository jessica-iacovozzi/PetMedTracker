"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Clock, CheckCircle2, Bell, Pill } from "lucide-react";
import { markReminderAsGivenAction } from "@/app/actions";
import { useRouter } from "next/navigation";

interface ReminderCardProps {
  reminder: {
    id: string;
    scheduled_time: string;
    status: string;
    pets: { name: string; species: string };
    medications: { name: string; dosage: string };
  };
  onMarkAsGiven?: () => void;
}

export default function ReminderCard({
  reminder,
  onMarkAsGiven = () => {},
}: ReminderCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleMarkAsGiven = async () => {
    setIsLoading(true);
    try {
      const result = await markReminderAsGivenAction(reminder.id);
      if (result.success) {
        onMarkAsGiven();
        router.refresh();
      }
    } catch (error) {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  };

  const scheduledTime = new Date(reminder.scheduled_time);
  const now = new Date();
  const isOverdue = now > scheduledTime && reminder.status === "pending";
  const isDue =
    Math.abs(now.getTime() - scheduledTime.getTime()) < 30 * 60 * 1000; // Within 30 minutes

  const getStatusColor = () => {
    if (reminder.status === "given") return "bg-green-100 text-green-800";
    if (reminder.status === "missed") return "bg-red-100 text-red-800";
    if (isOverdue) return "bg-red-100 text-red-800";
    if (isDue) return "bg-orange-100 text-orange-800";
    return "bg-blue-100 text-blue-800";
  };

  const getStatusText = () => {
    if (reminder.status === "given") return "Given";
    if (reminder.status === "missed") return "Missed";
    if (isOverdue) return "Overdue";
    if (isDue) return "Due Now";
    return "Upcoming";
  };

  return (
    <Card className="w-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">
              {reminder.pets.name}
            </CardTitle>
          </div>
          <Badge className={getStatusColor()}>{getStatusText()}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Pill className="w-5 h-5 text-gray-600" />
          <div>
            <p className="font-medium text-gray-900">
              {reminder.medications.name}
            </p>
            <p className="text-sm text-gray-600">
              {reminder.medications.dosage}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-gray-600" />
          <p className="text-sm text-gray-600">
            {scheduledTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {reminder.status === "pending" && (
          <div className="pt-2">
            <Button
              onClick={handleMarkAsGiven}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                "Marking..."
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Given
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
