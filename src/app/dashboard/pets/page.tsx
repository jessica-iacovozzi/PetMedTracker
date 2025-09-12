"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Heart, Plus } from "lucide-react";
import PetCard from "@/components/pet-card";
import PetProfileForm from "@/components/pet-profile-form";
import { getPets, deletePetAction, checkUserSubscription } from "@/app/actions";
import { createSupabaseClient } from "../../../../supabase/client";
import { useRouter } from "next/navigation";

interface Pet {
  id: string;
  name: string;
  species: string;
  photo?: string;
  medications?: any[];
}

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [deletingPetId, setDeletingPetId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const router = useRouter();

  const supabase = createSupabaseClient();

  const fetchPets = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const petsData = await getPets(user.id);
        setPets(petsData);
      }
    } catch (err) {
      setError("Failed to fetch pets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const handleAddPet = async () => {
    // Check subscription limits before allowing to add
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const isSubscribed = await checkUserSubscription(user.id);
        if (!isSubscribed && pets.length >= 1) {
          setShowUpgradeModal(true);
          return;
        }
      }
    } catch (err) {
      console.error("Error checking subscription:", err);
    }

    setEditingPet(null);
    setShowAddForm(true);
  };

  const handleEditPet = (pet: Pet) => {
    setEditingPet(pet);
    setShowAddForm(true);
  };

  const handleDeletePet = async (petId: string) => {
    try {
      const result = await deletePetAction(petId);
      if (result.error) {
        setError(result.error);
      } else {
        await fetchPets();
        setDeletingPetId(null);
      }
    } catch (err) {
      setError("Failed to delete pet");
    }
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingPet(null);
    fetchPets();
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto bg-gray-50 min-h-screen p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">Loading pets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Pets</h1>
          <p className="text-gray-600 mt-1">
            Manage your pets and their information
          </p>
        </div>
        <Button onClick={handleAddPet}>
          <Plus className="w-4 h-4 mr-2" />
          Add Pet
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pets.length}
                </p>
              </div>
              <Heart className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dogs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    pets.filter((pet) => pet.species.toLowerCase() === "dog")
                      .length
                  }
                </p>
              </div>
              <span className="text-2xl">🐕</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cats</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    pets.filter((pet) => pet.species.toLowerCase() === "cat")
                      .length
                  }
                </p>
              </div>
              <span className="text-2xl">🐱</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pets Grid */}
      {pets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onEdit={handleEditPet}
              onDelete={(petId) => setDeletingPetId(petId)}
              onAddMedication={() => {}} // TODO: Implement add medication
            />
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
            <Button onClick={handleAddPet}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Pet
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Pet Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPet ? "Edit Pet" : "Add New Pet"}</DialogTitle>
          </DialogHeader>
          <PetProfileForm
            pet={editingPet || undefined}
            onCancel={() => setShowAddForm(false)}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingPetId}
        onOpenChange={() => setDeletingPetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this pet? This will also delete
              all associated medications, reminders, and history. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPetId && handleDeletePet(deletingPetId)}
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
