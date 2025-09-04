"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import {
  Download,
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { checkUserSubscription } from "@/app/actions";

interface HistoryEntry {
  id: string;
  dosage: string;
  scheduled_time: string;
  status: "given" | "missed";
  created_at: string;
  pets: {
    name: string;
    species: string;
  };
  medications: {
    name: string;
    dosage: string;
  };
}

interface Pet {
  id: string;
  name: string;
  species: string;
}

interface HistoryLogProps {
  initialHistory: HistoryEntry[];
  pets: Pet[];
  userId: string;
}

export default function HistoryLog({
  initialHistory = [],
  pets = [],
  userId,
}: HistoryLogProps) {
  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory);
  const [filteredHistory, setFilteredHistory] =
    useState<HistoryEntry[]>(initialHistory);
  const [selectedPet, setSelectedPet] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Set default date range to last 7 days
  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(lastWeek.toISOString().split("T")[0]);
  }, []);

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const subscribed = await checkUserSubscription(userId);
        setIsSubscribed(subscribed);
      } catch (error) {
        setIsSubscribed(false);
      }
    };

    checkSubscription();
  }, [userId]);

  // Filter history based on selected filters
  useEffect(() => {
    let filtered = [...history];

    // Filter by pet
    if (selectedPet !== "all") {
      filtered = filtered.filter((entry) => {
        const pet = pets.find((p) => p.name === entry.pets.name);
        return pet?.id === selectedPet;
      });
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(
        (entry) => new Date(entry.scheduled_time) >= new Date(startDate),
      );
    }

    if (endDate) {
      filtered = filtered.filter(
        (entry) =>
          new Date(entry.scheduled_time) <= new Date(endDate + "T23:59:59"),
      );
    }

    setFilteredHistory(filtered);
  }, [history, selectedPet, startDate, endDate, pets]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Pet Name",
      "Species",
      "Medication",
      "Dosage",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredHistory.map((entry) =>
        [
          formatDate(entry.scheduled_time),
          entry.pets.name,
          entry.pets.species,
          entry.medications.name,
          entry.dosage,
          entry.status,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medication-history-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    if (!isSubscribed) {
      alert(
        "PDF export is only available for premium subscribers. Please upgrade your plan.",
      );
      return;
    }

    // This would typically call a server endpoint to generate PDF
    alert(
      "PDF export functionality would be implemented here for premium users.",
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === "given") {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Given
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <XCircle className="w-3 h-3 mr-1" />
          Missed
        </Badge>
      );
    }
  };

  const groupedHistory = filteredHistory.reduce(
    (groups, entry) => {
      const date = new Date(entry.scheduled_time).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
      return groups;
    },
    {} as Record<string, HistoryEntry[]>,
  );

  return (
    <div className="space-y-6 bg-gray-50">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Pet</label>
              <Select value={selectedPet} onValueChange={setSelectedPet}>
                <SelectTrigger>
                  <SelectValue placeholder="All pets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All pets</SelectItem>
                  {pets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                onClick={exportToPDF}
                variant={isSubscribed ? "default" : "outline"}
                className="flex-1"
                disabled={!isSubscribed}
              >
                <Download className="w-4 h-4 mr-2" />
                PDF {!isSubscribed && "🔒"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Medication History
            </span>
            <Badge variant="secondary">{filteredHistory.length} entries</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedHistory).length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No history found
              </h3>
              <p className="text-gray-600">
                No medication history matches your current filters.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedHistory)
                .sort(
                  ([a], [b]) => new Date(b).getTime() - new Date(a).getTime(),
                )
                .map(([date, entries]) => (
                  <div key={date}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Pet</TableHead>
                          <TableHead>Medication</TableHead>
                          <TableHead>Dosage</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entries
                          .sort(
                            (a, b) =>
                              new Date(b.scheduled_time).getTime() -
                              new Date(a.scheduled_time).getTime(),
                          )
                          .map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="font-medium">
                                {new Date(
                                  entry.scheduled_time,
                                ).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {entry.pets.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {entry.pets.species}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{entry.medications.name}</TableCell>
                              <TableCell>{entry.dosage}</TableCell>
                              <TableCell>
                                {getStatusBadge(entry.status)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
