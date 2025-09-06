"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Pill, Plus, Bell, Edit } from "lucide-react";
import { createMedicationAction, updateMedicationAction } from "@/app/actions";
import { createClient } from "../../supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useRouter } from "next/navigation";

interface Medication {
  id?: string;
  pet_id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration?: string;
}

interface Pet {
  id: string;
  name: string;
  species: string;
}

interface MedicationFormProps {
  medication?: Medication;
  pets?: Pet[];
  onSubmit?: (medication: any) => void;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function MedicationForm({
  medication,
  pets = [],
  onSubmit = () => {},
  onCancel = () => {},
  onSuccess = () => {},
}: MedicationFormProps) {
  const [formData, setFormData] = useState({
    petId: "",
    name: "",
    dosage: "",
    frequency: "",
    timing: "",
    duration: "",
    notes: "",
    enableReminders: true,
    reminderTime: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const isEditing = !!medication?.id;

  useEffect(() => {
    if (medication) {
      setFormData({
        petId: medication.pet_id || "",
        name: medication.name || "",
        dosage: medication.dosage || "",
        frequency: medication.frequency || "",
        timing: medication.timing || "",
        duration: medication.duration || "",
        notes: "",
        enableReminders: true,
        reminderTime: "",
      });
    }
  }, [medication]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const medicationData = {
        petId: formData.petId,
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        timing: formData.timing,
        duration: formData.duration,
      };

      let result;
      if (isEditing && medication?.id) {
        result = await updateMedicationAction(medication.id, medicationData);
      } else {
        result = await createMedicationAction(medicationData);
      }

      if (result.error) {
        // Check if it's a subscription limit error
        if (result.error.includes("Free plan allows only 2 medications")) {
          setShowUpgradeModal(true);
        } else {
          setError(result.error);
        }
      } else {
        onSubmit(formData);
        onSuccess();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            {isEditing ? (
              <Edit className="w-5 h-5 text-blue-600" />
            ) : (
              <Pill className="w-5 h-5 text-blue-600" />
            )}
            {isEditing ? "Edit Medication" : "Add New Medication"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pet Selection */}
            <div className="space-y-2">
              <Label htmlFor="pet">Select Pet *</Label>
              <Select
                value={formData.petId}
                onValueChange={(value) =>
                  setFormData({ ...formData, petId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a pet" />
                </SelectTrigger>
                <SelectContent>
                  {pets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Medication Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Medication Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Heartgard Plus, Apoquel"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
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

            {/* Frequency */}
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

            {/* Timing and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timing">Time of Day</Label>
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
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Optional)</Label>
                <Input
                  id="duration"
                  placeholder="e.g., 7 days, 2 weeks"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Special instructions, side effects to watch for, etc."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Reminder Settings */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <Label htmlFor="reminders" className="font-medium">
                    Enable Reminders
                  </Label>
                </div>
                <Switch
                  id="reminders"
                  checked={formData.enableReminders}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enableReminders: checked })
                  }
                />
              </div>
              {formData.enableReminders && (
                <div className="space-y-2">
                  <Label htmlFor="reminderTime">Reminder Time</Label>
                  <Input
                    id="reminderTime"
                    type="time"
                    value={formData.reminderTime}
                    onChange={(e) =>
                      setFormData({ ...formData, reminderTime: e.target.value })
                    }
                    placeholder="When to send reminder"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isEditing ? (
                  <Edit className="w-4 h-4 mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {isLoading
                  ? "Saving..."
                  : isEditing
                    ? "Update Medication"
                    : "Add Medication"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade to Premium</DialogTitle>
            <DialogDescription>
              You've reached your Free Plan limit. Upgrade to Premium for
              unlimited pets and medications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Premium Benefits:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Unlimited pets</li>
                <li>• Unlimited medications</li>
                <li>• Priority reminders</li>
                <li>• Export medication history</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpgradeModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => router.push("/pricing")}>Upgrade Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
