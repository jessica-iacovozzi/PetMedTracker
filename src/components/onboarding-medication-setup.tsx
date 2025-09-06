"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Pill, Clock } from "lucide-react";

interface OnboardingMedicationSetupProps {
  onComplete: (data: any) => void;
  onSkip: () => void;
  data: any;
  isLoading: boolean;
}

export default function OnboardingMedicationSetup({
  onComplete,
  onSkip,
  data,
  isLoading,
}: OnboardingMedicationSetupProps) {
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
    timing: "",
    duration: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !formData.name ||
      !formData.dosage ||
      !formData.frequency ||
      !formData.timing
    ) {
      setError("Please fill in all required fields");
      return;
    }

    onComplete({ medication: formData });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Pill className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Add {data.pet?.name}'s First Medication
        </h3>
        <p className="text-gray-600">
          Set up your first medication reminder to see how it works
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Medication Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Medication Name *</Label>
          <Input
            id="name"
            placeholder="e.g., Heartgard Plus, Apoquel, Rimadyl"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Dosage */}
        <div className="space-y-2">
          <Label htmlFor="dosage">Dosage *</Label>
          <Input
            id="dosage"
            placeholder="e.g., 1 tablet, 5mg, 2ml"
            value={formData.dosage}
            onChange={(e) =>
              setFormData({ ...formData, dosage: e.target.value })
            }
            required
          />
        </div>

        {/* Frequency and Timing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency *</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) =>
                setFormData({ ...formData, frequency: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="How often?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="twice-daily">Twice Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="as-needed">As Needed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timing">Time of Day *</Label>
            <Input
              id="timing"
              type="time"
              value={formData.timing}
              onChange={(e) =>
                setFormData({ ...formData, timing: e.target.value })
              }
              required
            />
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (Optional)</Label>
          <Input
            id="duration"
            placeholder="e.g., 7 days, 2 weeks, ongoing"
            value={formData.duration}
            onChange={(e) =>
              setFormData({ ...formData, duration: e.target.value })
            }
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? "Setting up..." : "Continue"}
            <Clock className="w-4 h-4 ml-2" />
          </Button>
          <Button type="button" variant="outline" onClick={onSkip}>
            Skip for now
          </Button>
        </div>
      </form>
    </div>
  );
}
