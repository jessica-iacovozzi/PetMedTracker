import * as actions from "@/app/actions";
import { createClient } from "../../../supabase/server";

// Mock Supabase server client
jest.mock("../../../supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = jest.mocked(createClient);

describe("Pets Service", () => {
  const mockUser = { id: "user-1" };
  
  // Create a more flexible mock that can be reconfigured per test
  const createMockQueryChain = (finalResult: any = { data: null, error: null }) => {
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
      
      // Mock the subscription check first (returns no subscription)
      const mockSubscriptionChain = createMockQueryChain({ data: null, error: null });
      
      // Mock the existing pets check (returns empty array)
      const mockExistingPetsChain = createMockQueryChain({ data: [], error: null });
      
      // Mock the pet creation
      const mockCreatePetChain = createMockQueryChain({ data: mockCreatedPet, error: null });
      
      mockSupabaseInstance.from
        .mockReturnValueOnce(mockSubscriptionChain) // First call for subscription check
        .mockReturnValueOnce(mockExistingPetsChain) // Second call for existing pets check  
        .mockReturnValueOnce(mockCreatePetChain); // Third call for pet creation

      const result = await actions.createPetAction(mockPetData);

      expect(result).toEqual({ success: true, data: mockCreatedPet });
      expect(mockSupabaseInstance.from).toHaveBeenCalledWith("subscriptions");
      expect(mockSupabaseInstance.from).toHaveBeenCalledWith("pets");
    });

    it("enforces free plan limits", async () => {
      // Mock the subscription check (returns no subscription)
      const mockSubscriptionChain = createMockQueryChain({ data: null, error: null });
      
      // Mock existing pets query to return 1 pet (free plan limit)
      // This needs to be a direct promise resolution since it's awaited with destructuring
      const mockExistingPetsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      // Make the final call resolve with existing pets data
      mockExistingPetsChain.eq.mockResolvedValue({ data: [{ id: "existing-pet" }], error: null });
      
      mockSupabaseInstance.from
        .mockReturnValueOnce(mockSubscriptionChain) // First call for subscription check
        .mockReturnValueOnce(mockExistingPetsChain as any); // Second call for existing pets check

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

      // Mock the subscription check (returns no subscription)
      const mockSubscriptionChain = createMockQueryChain({ data: null, error: null });
      
      // Mock existing pets query (returns empty array)
      const mockExistingPetsChain = createMockQueryChain({ data: [], error: null });
      
      // Mock the pet creation with database error
      const mockCreatePetChain = createMockQueryChain({ data: null, error: { message: "Database error" } });
      
      mockSupabaseInstance.from
        .mockReturnValueOnce(mockSubscriptionChain)
        .mockReturnValueOnce(mockExistingPetsChain)
        .mockReturnValueOnce(mockCreatePetChain);

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
      
      // Ensure auth returns the user
      mockSupabaseInstance.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      // Mock the update chain
      const mockUpdateChain = createMockQueryChain({ data: mockUpdatedPet, error: null });
      mockSupabaseInstance.from.mockReturnValue(mockUpdateChain);

      const result = await actions.updatePetAction(petId, updateData);

      expect(result).toEqual({ success: true, data: mockUpdatedPet });
    });

    it("handles update errors", async () => {
      const petId = "pet-1";
      const updateData = { name: "Updated Name", species: "dog" };

      // Ensure auth returns the user
      mockSupabaseInstance.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock the update chain with error
      const mockUpdateChain = createMockQueryChain({ data: null, error: { message: "Pet not found" } });
      mockSupabaseInstance.from.mockReturnValue(mockUpdateChain);

      const result = await actions.updatePetAction(petId, updateData);

      expect(result).toEqual({ error: "Pet not found" });
    });
  });

  describe("deletePetAction", () => {
    it("deletes a pet successfully", async () => {
      const petId = "pet-1";

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

      const result = await actions.deletePetAction(petId);

      expect(result).toEqual({ success: true });
    });

    it("handles delete errors", async () => {
      const petId = "pet-1";

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
        error: { message: "Failed to delete pet" },
      });
      mockSupabaseInstance.from.mockReturnValue(mockDeleteChain as any);

      const result = await actions.deletePetAction(petId);

      expect(result).toEqual({ error: "Failed to delete pet" });
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
