import * as actions from "@/app/actions";
import { createClient } from "../../../supabase/client";

// Mock Supabase client
jest.mock("../../../supabase/client");
const mockSupabase = createClient as jest.MockedFunction<typeof createClient>;

describe("Pets Service", () => {
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

  describe("createPetAction", () => {
    it("creates a pet successfully", async () => {
      const mockPetData = {
        name: "Buddy",
        species: "dog",
        breed: "Golden Retriever",
        age: "3 years",
        weight: "65 lbs",
      };

      const mockCreatedPet = { id: "pet-1", ...mockPetData, user_id: "user-1" };
      mockSupabaseInstance.from().single.mockResolvedValue({
        data: mockCreatedPet,
        error: null,
      });

      const result = await actions.createPetAction(mockPetData);

      expect(result).toEqual({ success: true, data: mockCreatedPet });
      expect(mockSupabaseInstance.from).toHaveBeenCalledWith("pets");
    });

    it("enforces free plan limits", async () => {
      // Mock existing pets query to return 1 pet (free plan limit)
      const mockFromChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockFromChain.select.mockResolvedValue({
        data: [{ id: "existing-pet" }],
        error: null,
      });
      mockSupabaseInstance.from.mockReturnValue(mockFromChain as any);

      const mockPetData = {
        name: "Second Pet",
        species: "cat",
      };

      const result = await actions.createPetAction(mockPetData);

      expect(result).toEqual({
        error: "Free plan allows only 1 pet. Please upgrade to add more pets.",
      });
    });

    it("handles database errors", async () => {
      const mockPetData = {
        name: "Buddy",
        species: "dog",
      };

      mockSupabaseInstance.from().single.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const result = await actions.createPetAction(mockPetData);

      expect(result).toEqual({ error: "Database error" });
    });

    it("requires authentication", async () => {
      mockSupabaseInstance.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const mockPetData = {
        name: "Buddy",
        species: "dog",
      };

      const result = await actions.createPetAction(mockPetData);

      expect(result).toEqual({ error: "User not authenticated" });
    });
  });

  describe("updatePetAction", () => {
    it("updates a pet successfully", async () => {
      const petId = "pet-1";
      const updateData = {
        name: "Updated Buddy",
        species: "dog",
        breed: "Labrador",
      };

      const mockUpdatedPet = { id: petId, ...updateData, user_id: "user-1" };
      mockSupabaseInstance.from().single.mockResolvedValue({
        data: mockUpdatedPet,
        error: null,
      });

      const result = await actions.updatePetAction(petId, updateData);

      expect(result).toEqual({ success: true, data: mockUpdatedPet });
    });

    it("handles update errors", async () => {
      const petId = "pet-1";
      const updateData = { name: "Updated Name", species: "dog" };

      mockSupabaseInstance.from().single.mockResolvedValue({
        data: null,
        error: { message: "Pet not found" },
      });

      const result = await actions.updatePetAction(petId, updateData);

      expect(result).toEqual({ error: "Pet not found" });
    });
  });

  describe("deletePetAction", () => {
    it("deletes a pet successfully", async () => {
      const petId = "pet-1";

      const mockDeleteChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockDeleteChain.eq.mockResolvedValue({ data: null, error: null });
      mockSupabaseInstance.from.mockReturnValue(mockDeleteChain as any);

      const result = await actions.deletePetAction(petId);

      expect(result).toEqual({ success: true });
    });

    it("handles delete errors", async () => {
      const petId = "pet-1";

      const mockDeleteChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockDeleteChain.eq.mockResolvedValue({
        data: null,
        error: { message: "Delete failed" },
      });
      mockSupabaseInstance.from.mockReturnValue(mockDeleteChain as any);

      const result = await actions.deletePetAction(petId);

      expect(result).toEqual({ error: "Delete failed" });
    });
  });

  describe("getPets", () => {
    it("retrieves pets with medications", async () => {
      const userId = "user-1";
      const mockPets = [
        {
          id: "pet-1",
          name: "Buddy",
          species: "dog",
          user_id: "user-1",
          breed: undefined,
          age: undefined,
          weight: undefined,
          photo: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          medications: [
            {
              id: "med-1",
              name: "Heartgard Plus",
              dosage: "1 tablet",
              frequency: "daily",
              timing: "08:00",
              duration: undefined,
              created_at: new Date().toISOString(),
            },
          ],
        },
      ];

      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      mockQueryChain.order.mockResolvedValue({ data: mockPets, error: null });
      mockSupabaseInstance.from.mockReturnValue(mockQueryChain as any);

      const result = await actions.getPets(userId);

      expect(result).toEqual(mockPets);
      expect(mockQueryChain.select).toHaveBeenCalledWith(
        expect.stringContaining("medications"),
      );
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

      await expect(actions.getPets(userId)).rejects.toThrow("Query failed");
    });
  });
});
