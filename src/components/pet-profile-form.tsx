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
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Heart, Upload, Plus, Edit } from "lucide-react";
import {
  createPetAction,
  updatePetAction,
  checkUserSubscription,
} from "@/app/actions";
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

interface Pet {
  id?: string;
  name: string;
  species: string;
  breed?: string;
  age?: string;
  weight?: string;
  photo?: string;
}

interface PetProfileFormProps {
  pet?: Pet;
  onSubmit?: (pet: Pet) => void;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function PetProfileForm({
  pet,
  onSubmit = () => {},
  onCancel = () => {},
  onSuccess = () => {},
}: PetProfileFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    age: "",
    weight: "",
    photo: "",
  });

  const [previewPhoto, setPreviewPhoto] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const isEditing = !!pet?.id;

  useEffect(() => {
    if (pet) {
      setFormData({
        name: pet.name || "",
        species: pet.species || "",
        breed: pet.breed || "",
        age: pet.age || "",
        weight: pet.weight || "",
        photo: pet.photo || "",
      });
      setPreviewPhoto(pet.photo || "");
    }
  }, [pet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      let result;
      if (isEditing && pet?.id) {
        result = await updatePetAction(pet.id, formData);
      } else {
        result = await createPetAction(formData);
      }

      if (result.error) {
        // Check if it's a subscription limit error
        if (result.error.includes("Free plan allows only 1 pet")) {
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewPhoto(result);
        setFormData({ ...formData, photo: result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            {isEditing ? (
              <Edit className="w-5 h-5 text-blue-600" />
            ) : (
              <Heart className="w-5 h-5 text-blue-600" />
            )}
            {isEditing ? "Edit Pet" : "Add New Pet"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={previewPhoto} alt="Pet photo" />
                <AvatarFallback className="bg-gray-100 text-gray-600">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="photo-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </Button>
              </div>
            </div>

            {/* Pet Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Pet Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Buddy, Whiskers"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            {/* Species */}
            <div className="space-y-2">
              <Label htmlFor="species">Species *</Label>
              <Select
                value={formData.species}
                onValueChange={(value) =>
                  setFormData({ ...formData, species: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">Dog</SelectItem>
                  <SelectItem value="cat">Cat</SelectItem>
                  <SelectItem value="bird">Bird</SelectItem>
                  <SelectItem value="rabbit">Rabbit</SelectItem>
                  <SelectItem value="hamster">Hamster</SelectItem>
                  <SelectItem value="fish">Fish</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Breed */}
            <div className="space-y-2">
              <Label htmlFor="breed">Breed (Optional)</Label>
              <Input
                id="breed"
                placeholder="e.g., Golden Retriever, Persian"
                value={formData.breed}
                onChange={(e) =>
                  setFormData({ ...formData, breed: e.target.value })
                }
              />
            </div>

            {/* Age and Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age (Optional)</Label>
                <Input
                  id="age"
                  placeholder="e.g., 3 years"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (Optional)</Label>
                <Input
                  id="weight"
                  placeholder="e.g., 25 lbs"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isEditing ? (
                  <Edit className="w-4 h-4 mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {isLoading ? "Saving..." : isEditing ? "Update Pet" : "Add Pet"}
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
