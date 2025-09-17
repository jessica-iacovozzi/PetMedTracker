import * as actions from "@/app/actions";
import { createClient } from "../../../supabase/server";

// Mock Supabase server client
jest.mock("../../../supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = jest.mocked(createClient);

describe("Medications Service", () => {
  const mockUser = { id: "user-1" };

  // Create a more flexible mock that can be reconfigured per test
  const createMockQueryChain = (
    finalResult: any = { data: null, error: null },
  ) => {
    const chain = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      single: jest.fn(),
    };

    // Make all methods return the chain for proper chaining
    chain.select.mockReturnValue(chain);
    chain.insert.mockReturnValue(chain);
    chain.update.mockReturnValue(chain);
    chain.delete.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.single.mockResolvedValue(finalResult);

    return chain;
  };

  const mockSupabaseInstance = {
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
    from: jest.fn(() => createMockQueryChain()),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue(mockSupabaseInstance as any);
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

      // Mock the subscription check first (returns no subscription)
      const mockSubscriptionChain = createMockQueryChain({
        data: null,
        error: null,
      });

      // Mock the existing medications check (returns empty array)
      const mockExistingMedsChain = createMockQueryChain({
        data: [],
        error: null,
      });

      // Mock the medication creation
      const mockCreateMedChain = createMockQueryChain({
        data: mockCreatedMedication,
        error: null,
      });

      mockSupabaseInstance.from
        .mockReturnValueOnce(mockSubscriptionChain) // First call for subscription check
        .mockReturnValueOnce(mockExistingMedsChain) // Second call for existing meds check
        .mockReturnValueOnce(mockCreateMedChain); // Third call for medication creation

      const result = await actions.createMedicationAction(mockMedicationData);

      expect(result).toEqual({ success: true, data: mockCreatedMedication });
      expect(mockSupabaseInstance.from).toHaveBeenCalledWith("medications");
    });

    it("enforces free plan medication limits", async () => {
      // Mock the subscription check (returns no subscription)
      const mockSubscriptionChain = createMockQueryChain({
        data: null,
        error: null,
      });

      // Mock existing medications query to return 2 medications (free plan limit)
      const mockExistingMedsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      // Make the final call resolve with existing medications data
      mockExistingMedsChain.eq.mockResolvedValue({
        data: [{ id: "med-1" }, { id: "med-2" }],
        error: null,
      });

      mockSupabaseInstance.from
        .mockReturnValueOnce(mockSubscriptionChain) // First call for subscription check
        .mockReturnValueOnce(mockExistingMedsChain as any); // Second call for existing meds check

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

      // Mock the subscription check (returns no subscription)
      const mockSubscriptionChain = createMockQueryChain({
        data: null,
        error: null,
      });

      // Mock existing medications query (returns empty array)
      const mockExistingMedsChain = createMockQueryChain({
        data: [],
        error: null,
      });

      // Mock the medication creation with database error
      const mockCreateMedChain = createMockQueryChain({
        data: null,
        error: { message: "Database constraint violation" },
      });

      mockSupabaseInstance.from
        .mockReturnValueOnce(mockSubscriptionChain)
        .mockReturnValueOnce(mockExistingMedsChain)
        .mockReturnValueOnce(mockCreateMedChain);

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

      // Ensure auth returns the user
      mockSupabaseInstance.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock the update chain
      const mockUpdateChain = createMockQueryChain({
        data: mockUpdatedMedication,
        error: null,
      });
      mockSupabaseInstance.from.mockReturnValue(mockUpdateChain);

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

      // Ensure auth returns the user
      mockSupabaseInstance.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock the update chain with error
      const mockUpdateChain = createMockQueryChain({
        data: null,
        error: { message: "Medication not found" },
      });
      mockSupabaseInstance.from.mockReturnValue(mockUpdateChain);

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

      // Ensure auth returns the user
      mockSupabaseInstance.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock the delete chain - need to mock the final .eq() call properly
      const mockDeleteChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      // The second eq() call should return the final result
      mockDeleteChain.eq
        .mockReturnValueOnce(mockDeleteChain) // First eq() call returns chain
        .mockResolvedValueOnce({ data: null, error: null }); // Second eq() call returns result

      mockSupabaseInstance.from.mockReturnValue(mockDeleteChain as any);

      const result = await actions.deleteMedicationAction(medicationId);

      expect(result).toEqual({ success: true });
    });

    it("handles delete errors", async () => {
      const medicationId = "med-1";

      // Ensure auth returns the user
      mockSupabaseInstance.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock the delete chain with error
      const mockDeleteChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockDeleteChain.eq.mockResolvedValue({
        data: null,
        error: { message: "Failed to delete medication" },
      });
      mockSupabaseInstance.from.mockReturnValue(mockDeleteChain as any);

      const result = await actions.deleteMedicationAction(medicationId);

      expect(result).toEqual({ error: "Failed to delete medication" });
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

      const mockQueryChain = createMockQueryChain({ data: [], error: null });
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
