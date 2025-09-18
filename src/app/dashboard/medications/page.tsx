"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pill, Plus, Edit, Trash2, Clock, Calendar } from "lucide-react";
import MedicationForm from "@/components/medication-form";
import {
  getMedications,
  getPets,
  deleteMedicationAction,
  checkUserSubscription,
} from "@/app/actions";
import { createSupabaseClient } from "../../../../supabase/client";
import { useRouter } from "next/navigation";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration?: string;
  pet_id: string;
  pets: {
    name: string;
    species: string;
  };
}

interface Pet {
  id: string;
  name: string;
  species: string;
}

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(
    null,
  );
  const [deletingMedicationId, setDeletingMedicationId] = useState<
    string | null
  >(null);
  const [error, setError] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const router = useRouter();

  const supabase = createSupabaseClient();

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const [medicationsData, petsData] = await Promise.all([
          getMedications(user.id),
          getPets(user.id),
        ]);
        setMedications(medicationsData);
        setPets(petsData);
      }
    } catch (err) {
      setError("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMedication = async () => {
    // Check subscription limits before allowing to add
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const isSubscribed = await checkUserSubscription(user.id);
        if (!isSubscribed && medications.length >= 2) {
          setShowUpgradeModal(true);
          return;
        }
      }
    } catch (err) {
      console.error("Error checking subscription:", err);
    }

    setEditingMedication(null);
    setShowAddForm(true);
  };

  const handleEditMedication = (medication: Medication) => {
    setEditingMedication(medication);
    setShowAddForm(true);
  };

  const handleDeleteMedication = async (medicationId: string) => {
    try {
      const result = await deleteMedicationAction(medicationId);
      if (result.error) {
        setError(result.error);
      } else {
        await fetchData();
        setDeletingMedicationId(null);
      }
    } catch (err) {
      setError("Failed to delete medication");
    }
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingMedication(null);
    fetchData();
  };

  const getFrequencyBadgeColor = (frequency: string) => {
    switch (frequency.toLowerCase()) {
      case "daily":
        return "bg-green-100 text-green-800";
      case "twice-daily":
        return "bg-blue-100 text-blue-800";
      case "weekly":
        return "bg-purple-100 text-purple-800";
      case "monthly":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto bg-gray-50 min-h-screen p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">Loading medications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medications</h1>
          <p className="text-gray-600 mt-1">
            Manage all medications for your pets
          </p>
        </div>
        <Button onClick={handleAddMedication} disabled={pets.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          Add Medication
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* No Pets Warning */}
      {pets.length === 0 && (
        <Card className="bg-yellow-50 border-yellow-200 mb-8">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Pill className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">No pets found</p>
                <p className="text-sm text-yellow-700">
                  You need to add at least one pet before you can add
                  medications.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Medications
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {medications.length}
                </p>
              </div>
              <Pill className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Daily Medications
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    medications.filter(
                      (med) => med.frequency.toLowerCase() === "daily",
                    ).length
                  }
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
                <p className="text-sm font-medium text-gray-600">Active Pets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(medications.map((med) => med.pet_id)).size}
                </p>
              </div>
              <span className="text-2xl">🐾</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Morning Doses
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    medications.filter((med) => {
                      const hour = parseInt(med.timing.split(":")[0]);
                      return hour >= 6 && hour < 12;
                    }).length
                  }
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medications List */}
      {medications.length > 0 ? (
        <div className="space-y-4">
          {medications.map((medication) => (
            <Card
              key={medication.id}
              className="bg-white border border-gray-200"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Pill className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {medication.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        For {medication.pets.name} ({medication.pets.species})
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-gray-700">
                            Dosage:
                          </span>
                          <span className="text-sm text-gray-600">
                            {medication.dosage}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {medication.timing}
                          </span>
                        </div>
                        <Badge
                          className={getFrequencyBadgeColor(
                            medication.frequency,
                          )}
                        >
                          {medication.frequency}
                        </Badge>
                        {medication.duration && (
                          <Badge variant="outline">{medication.duration}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditMedication(medication)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingMedicationId(medication.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-12 text-center">
            <Pill className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No medications added yet
            </h3>
            <p className="text-gray-600 mb-6">
              {pets.length === 0
                ? "Add a pet first, then you can start tracking their medications."
                : "Start by adding your first medication to track dosing schedules."}
            </p>
            {pets.length > 0 && (
              <Button onClick={handleAddMedication}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Medication
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Medication Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMedication ? "Edit Medication" : "Add New Medication"}
            </DialogTitle>
          </DialogHeader>
          <MedicationForm
            medication={editingMedication || undefined}
            pets={pets}
            onCancel={() => setShowAddForm(false)}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingMedicationId}
        onOpenChange={() => setDeletingMedicationId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medication</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this medication? This will also
              delete all future reminders for this medication. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingMedicationId &&
                handleDeleteMedication(deletingMedicationId)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade to Premium</DialogTitle>
            <DialogDescription>
              You&apos;ve reached your Free Plan limit. Upgrade to Premium for
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
