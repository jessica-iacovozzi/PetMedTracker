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
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Upload, Heart } from "lucide-react";

interface PetSetupData {
  name: string;
  species: string;
  photo?: string;
}

interface OnboardingPetSetupProps {
  onComplete: (data: { pet: PetSetupData }) => void;
  isLoading: boolean;
}

export default function OnboardingPetSetup({
  onComplete,
  isLoading,
}: OnboardingPetSetupProps) {
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    photo: "",
  });
  const [previewPhoto, setPreviewPhoto] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.species) {
      setError("Please fill in all required fields");
      return;
    }

    onComplete({ pet: formData });
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
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">
          Tell us about your pet
        </h3>
        <p className="text-gray-600">
          We&apos;ll use this information to personalize your experience
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload */}
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-24 h-24">
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
              Upload Photo (Optional)
            </Button>
          </div>
        </div>

        {/* Pet Name */}
        <div className="space-y-2">
          <Label htmlFor="name" aria-labelledby="name">Pet Name *</Label>
          <Input
            id="name"
            placeholder="e.g., Buddy, Whiskers, Charlie"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Species */}
        <div className="space-y-2">
          <Label htmlFor="species" aria-labelledby="species">Species *</Label>
          <Select
            value={formData.species}
            onValueChange={(value) =>
              setFormData({ ...formData, species: value })
            }
            required
          >
            <SelectTrigger id="species">
              <SelectValue placeholder="Select your pet's species" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dog">🐕 Dog</SelectItem>
              <SelectItem value="cat">🐱 Cat</SelectItem>
              <SelectItem value="bird">🐦 Bird</SelectItem>
              <SelectItem value="rabbit">🐰 Rabbit</SelectItem>
              <SelectItem value="hamster">🐹 Hamster</SelectItem>
              <SelectItem value="fish">🐠 Fish</SelectItem>
              <SelectItem value="other">🐾 Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Adding Pet..." : "Continue"}
          <Heart className="w-4 h-4 ml-2" />
        </Button>
      </form>
    </div>
  );
}
