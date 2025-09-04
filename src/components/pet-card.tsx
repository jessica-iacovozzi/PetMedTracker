import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Clock, Pill, CheckCircle2 } from "lucide-react";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  nextDose: string;
  status: "due" | "upcoming" | "given";
}

interface Pet {
  id: string;
  name: string;
  species: string;
  photo?: string;
  medications: Medication[];
}

interface PetCardProps {
  pet?: Pet;
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
}: PetCardProps) {
  const dueMedications = pet.medications.filter((med) => med.status === "due");
  const upcomingMedications = pet.medications.filter(
    (med) => med.status === "upcoming",
  );

  return (
    <Card className="w-full max-w-md bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
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
      </CardHeader>

      <CardContent className="space-y-4">
        {dueMedications.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-600 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Due Now ({dueMedications.length})
            </h4>
            {dueMedications.map((med) => (
              <div
                key={med.id}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
              >
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {med.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {med.dosage} • {med.nextDose}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Mark Given
                </Button>
              </div>
            ))}
          </div>
        )}

        {upcomingMedications.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-600 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Upcoming ({upcomingMedications.length})
            </h4>
            {upcomingMedications.map((med) => (
              <div
                key={med.id}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {med.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {med.dosage} • {med.nextDose}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {med.nextDose}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {pet.medications.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Pill className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No medications scheduled</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
