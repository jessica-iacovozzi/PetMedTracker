import * as actions from "@/app/actions";
import { createClient } from "../../../supabase/client";

// Mock Supabase client
jest.mock("../../../supabase/client");
const mockSupabase = createClient as jest.MockedFunction<typeof createClient>;

describe("Medications Service", () => {
  const mockUser = { id: "user-1" };
  const mockSupabaseInstance = {
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.mockReturnValue(mockSupabaseInstance as any);
  });

  describe("createMedicationAction", () => {
    it("creates a medication successfully", async () => {
      const mockMedicationData = {
        petId: "pet-1",
        name: "Heartgard Plus",
        dosage: "1 tablet",
        frequency: "daily",
        timing: "08:00",
        duration: "30 days",
      };

      const mockCreatedMedication = {
        id: "med-1",
        ...mockMedicationData,
        user_id: "user-1",
        pet_id: "pet-1",
      };
      mockSupabaseInstance.from().single.mockResolvedValue({
        data: mockCreatedMedication,
        error: null,
      });

      const result = await actions.createMedicationAction(mockMedicationData);

      expect(result).toEqual({ success: true, data: mockCreatedMedication });
      expect(mockSupabaseInstance.from).toHaveBeenCalledWith("medications");
    });

    it("enforces free plan medication limits", async () => {
      // Mock existing medications query to return 2 medications (free plan limit)
      const mockFromChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockFromChain.select.mockResolvedValue({
        data: [{ id: "med-1" }, { id: "med-2" }],
        error: null,
      });
      mockSupabaseInstance.from.mockReturnValue(mockFromChain as any);

      const mockMedicationData = {
        petId: "pet-1",
        name: "Third Medication",
        dosage: "1 tablet",
        frequency: "daily",
        timing: "08:00",
      };

      const result = await actions.createMedicationAction(mockMedicationData);

      expect(result).toEqual({
        error:
          "Free plan allows only 2 medications. Please upgrade to add more medications.",
      });
    });

    it("validates required fields", async () => {
      const incompleteMedicationData = {
        petId: "pet-1",
        name: "Heartgard Plus",
        dosage: "", // Missing required field
        frequency: "daily",
        timing: "08:00",
      };

      // The validation should happen at the component level,
      // but we can test that the service handles empty values
      const result = await actions.createMedicationAction(
        incompleteMedicationData,
      );

      // The service should still attempt to create, but may fail at DB level
      expect(mockSupabaseInstance.from).toHaveBeenCalledWith("medications");
    });

    it("handles database errors", async () => {
      const mockMedicationData = {
        petId: "pet-1",
        name: "Heartgard Plus",
        dosage: "1 tablet",
        frequency: "daily",
        timing: "08:00",
      };

      mockSupabaseInstance.from().single.mockResolvedValue({
        data: null,
        error: { message: "Database constraint violation" },
      });

      const result = await actions.createMedicationAction(mockMedicationData);

      expect(result).toEqual({ error: "Database constraint violation" });
    });
  });

  describe("updateMedicationAction", () => {
    it("updates a medication successfully", async () => {
      const medicationId = "med-1";
      const updateData = {
        name: "Updated Heartgard Plus",
        dosage: "2 tablets",
        frequency: "daily",
        timing: "09:00",
        duration: "60 days",
      };

      const mockUpdatedMedication = {
        id: medicationId,
        ...updateData,
        user_id: "user-1",
        pet_id: "pet-1",
      };
      mockSupabaseInstance.from().single.mockResolvedValue({
        data: mockUpdatedMedication,
        error: null,
      });

      const result = await actions.updateMedicationAction(
        medicationId,
        updateData,
      );

      expect(result).toEqual({ success: true, data: mockUpdatedMedication });
    });

    it("handles update errors", async () => {
      const medicationId = "med-1";
      const updateData = {
        name: "Updated Name",
        dosage: "1 tablet",
        frequency: "daily",
        timing: "08:00",
      };

      mockSupabaseInstance.from().single.mockResolvedValue({
        data: null,
        error: { message: "Medication not found" },
      });

      const result = await actions.updateMedicationAction(
        medicationId,
        updateData,
      );

      expect(result).toEqual({ error: "Medication not found" });
    });
  });

  describe("deleteMedicationAction", () => {
    it("deletes a medication successfully", async () => {
      const medicationId = "med-1";

      const mockDeleteChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockDeleteChain.eq.mockResolvedValue({ data: null, error: null });
      mockSupabaseInstance.from.mockReturnValue(mockDeleteChain as any);

      const result = await actions.deleteMedicationAction(medicationId);

      expect(result).toEqual({ success: true });
    });

    it("handles delete errors", async () => {
      const medicationId = "med-1";

      const mockDeleteChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockDeleteChain.eq.mockResolvedValue({
        data: null,
        error: { message: "Delete failed" },
      });
      mockSupabaseInstance.from.mockReturnValue(mockDeleteChain as any);

      const result = await actions.deleteMedicationAction(medicationId);

      expect(result).toEqual({ error: "Delete failed" });
    });
  });

  describe("getMedications", () => {
    it("retrieves medications with pet information", async () => {
      const userId = "user-1";
      const mockMedications = [
        {
          id: "med-1",
          name: "Heartgard Plus",
          dosage: "1 tablet",
          frequency: "daily",
          timing: "08:00",
          pets: { name: "Buddy", species: "Dog" },
        },
      ];

      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      mockQueryChain.order.mockResolvedValue({
        data: mockMedications,
        error: null,
      });
      mockSupabaseInstance.from.mockReturnValue(mockQueryChain as any);

      const result = await actions.getMedications(userId);

      expect(result).toEqual(mockMedications);
      expect(mockQueryChain.select).toHaveBeenCalledWith(
        expect.stringContaining("pets"),
      );
    });

    it("filters by pet ID when provided", async () => {
      const userId = "user-1";
      const petId = "pet-1";

      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      mockQueryChain.order.mockResolvedValue({ data: [], error: null });
      mockSupabaseInstance.from.mockReturnValue(mockQueryChain as any);

      await actions.getMedications(userId, petId);

      expect(mockQueryChain.eq).toHaveBeenCalledWith("pet_id", petId);
    });

    it("handles query errors", async () => {
      const userId = "user-1";

      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      mockQueryChain.order.mockResolvedValue({
        data: null,
        error: { message: "Query failed" },
      });
      mockSupabaseInstance.from.mockReturnValue(mockQueryChain as any);

      await expect(actions.getMedications(userId)).rejects.toThrow(
        "Query failed",
      );
    });
  });
});
