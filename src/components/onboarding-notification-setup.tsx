"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Bell, Mail, Smartphone } from "lucide-react";

interface OnboardingNotificationSetupProps {
  onComplete: (data: any) => void;
  onSkip: () => void;
  isLoading: boolean;
}

export default function OnboardingNotificationSetup({
  onComplete,
  onSkip,
  isLoading,
}: OnboardingNotificationSetupProps) {
  const [notifications, setNotifications] = useState({
    emailEnabled: true,
    pushEnabled: true,
  });

  const handleSubmit = () => {
    onComplete({ notifications });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Bell className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Set Up Notifications
        </h3>
        <p className="text-gray-600">
          Choose how you'd like to receive medication reminders
        </p>
      </div>

      <div className="space-y-6">
        {/* Email Notifications */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <Label
                htmlFor="email-notifications"
                className="text-base font-medium"
              >
                Email Reminders
              </Label>
              <p className="text-sm text-gray-600">
                Get medication reminders sent to your email
              </p>
            </div>
          </div>
          <Switch
            id="email-notifications"
            checked={notifications.emailEnabled}
            onCheckedChange={(checked) =>
              setNotifications({ ...notifications, emailEnabled: checked })
            }
          />
        </div>

        {/* Push Notifications */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <Label
                htmlFor="push-notifications"
                className="text-base font-medium"
              >
                Push Notifications
              </Label>
              <p className="text-sm text-gray-600">
                Get instant notifications on your device
              </p>
            </div>
          </div>
          <Switch
            id="push-notifications"
            checked={notifications.pushEnabled}
            onCheckedChange={(checked) =>
              setNotifications({ ...notifications, pushEnabled: checked })
            }
          />
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Why notifications matter
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Timely reminders help ensure your pet never misses a dose,
                keeping them healthy and happy. You can always change these
                settings later.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button onClick={handleSubmit} className="flex-1" disabled={isLoading}>
          {isLoading ? "Saving..." : "Continue"}
          <Bell className="w-4 h-4 ml-2" />
        </Button>
        <Button type="button" variant="outline" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}
