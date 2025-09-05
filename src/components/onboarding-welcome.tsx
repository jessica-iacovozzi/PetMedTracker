"use client";

import { Button } from "./ui/button";
import { Heart, Bell, Calendar, Shield } from "lucide-react";

interface OnboardingWelcomeProps {
  onComplete: (data: any) => void;
}

export default function OnboardingWelcome({
  onComplete,
}: OnboardingWelcomeProps) {
  const features = [
    {
      icon: <Bell className="w-5 h-5" />,
      title: "Never Miss a Dose",
      description: "Get timely reminders for all your pet's medications",
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "Easy Scheduling",
      description: "Set up medication schedules in just a few clicks",
    },
    {
      icon: <Heart className="w-5 h-5" />,
      title: "Multiple Pets",
      description: "Manage medications for all your furry family members",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Track History",
      description: "Keep a complete record of medication administration",
    },
  ];

  return (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Heart className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome to PetMeds!
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Never miss a pet's medication again. Let's set up your account in just
          a few simple steps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 rounded-lg text-left space-y-2"
          >
            <div className="flex items-center gap-2">
              <div className="text-blue-600">{feature.icon}</div>
              <h3 className="font-medium text-gray-900">{feature.title}</h3>
            </div>
            <p className="text-sm text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>

      <Button onClick={() => onComplete({})} size="lg" className="w-full">
        Get Started
        <Heart className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
