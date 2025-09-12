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
  const timeDiff = scheduledTime.getTime() - now.getTime();
  const isUpcoming = timeDiff > 0 && timeDiff <= 2 * 60 * 60 * 1000; // Within 2 hours
  const isDueNow =
    Math.abs(timeDiff) <= 30 * 60 * 1000 && reminder.status === "pending"; // Within 30 minutes

  const getStatusColor = () => {
    if (reminder.status === "given")
      return "bg-green-100 text-green-800 border-green-200";
    if (reminder.status === "missed")
      return "bg-red-100 text-red-800 border-red-200";
    if (isOverdue) return "bg-red-100 text-red-800 border-red-200";
    if (isDueNow) return "bg-orange-100 text-orange-800 border-orange-200";
    if (isUpcoming) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  const getStatusText = () => {
    if (reminder.status === "given") return "✓ Given";
    if (reminder.status === "missed") return "✗ Missed";
    if (isOverdue) return "⚠️ Overdue";
    if (isDueNow) return "🔔 Due Now";
    if (isUpcoming) return "⏰ Due Soon";
    return "📅 Scheduled";
  };

  const getCardBorderColor = () => {
    if (reminder.status === "given") return "border-green-200";
    if (reminder.status === "missed") return "border-red-200";
    if (isOverdue) return "border-red-300";
    if (isDueNow) return "border-orange-300";
    if (isUpcoming) return "border-yellow-300";
    return "border-gray-200";
  };

  return (
    <Card
      className={`w-full bg-white border-2 ${getCardBorderColor()} shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell
              className={`w-4 h-4 ${
                isOverdue
                  ? "text-red-600"
                  : isDueNow
                    ? "text-orange-600"
                    : isUpcoming
                      ? "text-yellow-600"
                      : "text-blue-600"
              }`}
            />
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
          <div>
            <p className="text-sm font-medium text-gray-900">
              {scheduledTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {isOverdue && (
              <p className="text-xs text-red-600">
                {Math.floor(
                  (now.getTime() - scheduledTime.getTime()) / (1000 * 60),
                )}{" "}
                min late
              </p>
            )}
            {isUpcoming && !isDueNow && (
              <p className="text-xs text-yellow-600">
                in {Math.floor(timeDiff / (1000 * 60))} min
              </p>
            )}
          </div>
        </div>

        {reminder.status === "pending" && (
          <div className="pt-2 space-y-2">
            <Button
              onClick={handleMarkAsGiven}
              disabled={isLoading}
              className={`w-full text-white ${
                isOverdue || isDueNow
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
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
            {(isOverdue || isDueNow) && (
              <p className="text-xs text-center text-gray-600">
                Don't forget to give the medication to avoid double-dosing
              </p>
            )}
          </div>
        )}

        {reminder.status === "given" && (
          <div className="pt-2">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Completed</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
