"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { CheckCircle2, Heart, Calendar, Bell, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createPetAction,
  createMedicationAction,
  updateNotificationPreferencesAction,
} from "@/app/actions";

interface OnboardingCompletionProps {
  data: any;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function OnboardingCompletion({
  data,
  isLoading,
  setIsLoading,
}: OnboardingCompletionProps) {
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const completeOnboarding = async () => {
      if (isComplete) return;

      setIsLoading(true);
      setError("");

      try {
        // Create pet if provided
        let petId = null;
        if (data.pet) {
          const petResult = await createPetAction(data.pet);
          if (petResult.error) {
            throw new Error(petResult.error);
          }
          petId = petResult.data?.id;
        }

        // Create medication if provided and pet was created
        if (data.medication && petId) {
          const medicationResult = await createMedicationAction({
            ...data.medication,
            petId,
          });
          if (medicationResult.error) {
            throw new Error(medicationResult.error);
          }
        }

        // Update notification preferences if provided
        if (data.notifications) {
          const notificationResult = await updateNotificationPreferencesAction(
            data.notifications,
          );
          if (notificationResult.error) {
            throw new Error(notificationResult.error);
          }
        }

        setIsComplete(true);
      } catch (err: any) {
        setError(err.message || "Failed to complete onboarding");
      } finally {
        setIsLoading(false);
      }
    };

    completeOnboarding();
  }, [data, isComplete, setIsLoading]);

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  if (error) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-2xl">❌</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Something went wrong
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <Heart className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Setting up your account...
          </h3>
          <p className="text-gray-600">
            We're creating your pet profile and medication reminders
          </p>
        </div>
      </div>
    );
  }

  const nextReminderTime = data.medication?.timing
    ? new Date(`2024-01-01T${data.medication.timing}`).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>

      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">All Set! 🎉</h3>
        <p className="text-gray-600">
          Your PetMeds account is ready to help you keep{" "}
          {data.pet?.name || "your pet"} healthy
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-gray-900">What we've set up:</h4>
        <div className="space-y-2 text-sm">
          {data.pet && (
            <div className="flex items-center gap-2 text-gray-700">
              <Heart className="w-4 h-4 text-blue-600" />
              <span>
                Added {data.pet.name} ({data.pet.species})
              </span>
            </div>
          )}
          {data.medication && (
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4 text-green-600" />
              <span>Set up {data.medication.name} medication</span>
            </div>
          )}
          {data.notifications && (
            <div className="flex items-center gap-2 text-gray-700">
              <Bell className="w-4 h-4 text-orange-600" />
              <span>Configured notification preferences</span>
            </div>
          )}
        </div>
      </div>

      {nextReminderTime && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            🔔 Your first reminder is scheduled for {nextReminderTime}
          </p>
          <p className="text-sm text-blue-700 mt-1">
            You'll receive a notification when it's time for {data.pet?.name}'s
            medication
          </p>
        </div>
      )}

      <Button onClick={handleGoToDashboard} size="lg" className="w-full">
        Go to Dashboard
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
