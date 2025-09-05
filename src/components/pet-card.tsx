import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Clock,
  Pill,
  CheckCircle2,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  nextDose?: string;
  status: "due" | "upcoming" | "given";
}

interface Pet {
  id: string;
  name: string;
  species: string;
  photo?: string;
  medications?: Medication[];
}

interface PetCardProps {
  pet?: Pet;
  onEdit?: (pet: Pet) => void;
  onDelete?: (petId: string) => void;
  onAddMedication?: (petId: string) => void;
}

export default function PetCard({
  pet = {
    id: "1",
    name: "Buddy",
    species: "Dog",
    photo:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&q=80",
    medications: [
      {
        id: "1",
        name: "Heartgard Plus",
        dosage: "1 tablet",
        nextDose: "2:00 PM",
        status: "due",
      },
      {
        id: "2",
        name: "Apoquel",
        dosage: "16mg",
        nextDose: "6:00 PM",
        status: "upcoming",
      },
    ],
  },
  onEdit = () => {},
  onDelete = () => {},
  onAddMedication = () => {},
}: PetCardProps) {
  const dueMedications =
    pet.medications?.filter((med) => med.status === "due").length || 0;
  const upcomingMedications =
    pet.medications?.filter((med) => med.status === "upcoming").length || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "due":
        return "bg-red-100 text-red-800";
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "given":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white">
      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={pet.photo} alt={pet.name} />
                <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                  {pet.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {pet.name}
                </CardTitle>
                <p className="text-sm text-gray-600">{pet.species}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAddMedication(pet.id)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Medication
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(pet)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Pet
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(pet.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Pet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Summary */}
          <div className="flex gap-2">
            {dueMedications > 0 && (
              <Badge className="bg-red-100 text-red-800 text-xs">
                {dueMedications} due
              </Badge>
            )}
            {upcomingMedications > 0 && (
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                {upcomingMedications} upcoming
              </Badge>
            )}
            {(!pet.medications || pet.medications.length === 0) && (
              <Badge className="bg-gray-100 text-gray-600 text-xs">
                No medications
              </Badge>
            )}
          </div>

          {/* Medications List */}
          {pet.medications && pet.medications.length > 0 ? (
            <div className="space-y-3">
              {pet.medications.slice(0, 3).map((medication) => (
                <div
                  key={medication.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full">
                      <Pill className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {medication.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {medication.dosage}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(medication.status)}>
                      {medication.status}
                    </Badge>
                    {medication.nextDose && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {medication.nextDose}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {pet.medications.length > 3 && (
                <p className="text-xs text-gray-500 text-center">
                  +{pet.medications.length - 3} more medications
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Pill className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-3">
                No medications added yet
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddMedication(pet.id)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Medication
              </Button>
            </div>
          )}

          {/* Quick Actions */}
          {dueMedications > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <Button size="sm" className="w-full bg-red-600 hover:bg-red-700">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark {dueMedications} as Given
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
