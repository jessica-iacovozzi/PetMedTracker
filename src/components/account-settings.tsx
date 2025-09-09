"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { FormMessage } from "./form-message";
import { SubmitButton } from "./submit-button";
import {
  updateProfileAction,
  updateNotificationPreferencesAction,
} from "@/app/actions";
import { createSupabaseClient } from "../../supabase/client";
import { useRouter } from "next/navigation";
import {
  Settings,
  User as UserIcon,
  Bell,
  CreditCard,
  Shield,
} from "lucide-react";

interface AccountSettingsProps {
  user: User;
  userProfile: any;
  notificationPrefs: any;
  subscription: any;
}

export default function AccountSettings({
  user,
  userProfile,
  notificationPrefs,
  subscription,
}: AccountSettingsProps) {
  const [message, setMessage] = useState<{
    success?: string;
    error?: string;
  } | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(
    notificationPrefs?.email_enabled ?? true,
  );
  const [pushNotifications, setPushNotifications] = useState(
    notificationPrefs?.push_enabled ?? true,
  );
  const supabase = createSupabaseClient();
  const router = useRouter();

  const handleProfileUpdate = async (formData: FormData) => {
    try {
      const result = await updateProfileAction(formData);
      if (result?.error) {
        setMessage({ error: result.error });
      } else {
        setMessage({ success: "Profile updated successfully!" });
        // Refresh the page to show updated data
        router.refresh();
      }
    } catch (error) {
      setMessage({ error: "Failed to update profile" });
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      const result = await updateNotificationPreferencesAction({
        emailEnabled: emailNotifications,
        pushEnabled: pushNotifications,
      });
      if (result?.error) {
        setMessage({ error: result.error });
      } else {
        setMessage({ success: "Notification preferences updated!" });
      }
    } catch (error) {
      setMessage({ error: "Failed to update notification preferences" });
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-create-customer-portal",
        {
          body: {
            user_id: user.id,
            return_url: `${window.location.origin}/dashboard/settings`,
          },
        },
      );

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (error) {
      setMessage({ error: "Failed to open subscription management" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account details, notifications, and subscription
          </p>
        </div>
      </div>

      {/* Profile Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>
            Update your personal information and account details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  defaultValue={
                    userProfile?.name || userProfile?.full_name || ""
                  }
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={user.email || ""}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Change Password</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter new password"
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <SubmitButton
              className="w-full md:w-auto"
              pendingText="Updating..."
            >
              Update Profile
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>
            Choose how you want to receive medication reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications" className="text-base">
                Email Reminders
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive medication reminders via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications" className="text-base">
                Push Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive medication reminders as push notifications
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>

          <Button
            onClick={handleNotificationUpdate}
            className="w-full md:w-auto"
          >
            Save Notification Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Subscription Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Subscription</CardTitle>
          </div>
          <CardDescription>
            Manage your subscription plan and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-medium">Premium Plan</h4>
                  <p className="text-sm text-muted-foreground">
                    ${(subscription.amount / 100).toFixed(2)}/
                    {subscription.interval}
                  </p>
                  {subscription.current_period_end && (
                    <p className="text-sm text-muted-foreground">
                      Next billing:{" "}
                      {new Date(
                        subscription.current_period_end * 1000,
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    Active
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleManageSubscription} variant="outline">
                  Manage Subscription
                </Button>
                <Button onClick={handleManageSubscription} variant="outline">
                  Update Payment Method
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium">Free Plan</h4>
                <p className="text-sm text-muted-foreground">
                  You're currently on the free plan with limited features
                </p>
              </div>

              <Button
                onClick={() => router.push("/pricing")}
                className="w-full md:w-auto"
              >
                Upgrade to Premium
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Display */}
      {message && (
        <div className="mt-6">
          {message.success && <FormMessage message={{ success: message.success }} />}
          {message.error && <FormMessage message={{ error: message.error }} />}
        </div>
      )}
    </div>
  );
}
