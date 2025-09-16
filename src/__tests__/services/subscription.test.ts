import * as actions from "@/app/actions";
import { createClient } from "../../../supabase/server";

// Mock Supabase server client
jest.mock("../../../supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = jest.mocked(createClient);

describe("Subscription Service", () => {
  // Create a more flexible mock that can be reconfigured per test
  const createMockQueryChain = (finalResult: any = { data: null, error: null }) => {
    const chain = {
      select: jest.fn(),
      eq: jest.fn(),
      single: jest.fn(),
    };
    
    // Make all methods return the chain for proper chaining
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.single.mockResolvedValue(finalResult);
    
    return chain;
  };
  
  const mockSupabaseInstance = {
    from: jest.fn(() => createMockQueryChain()),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue(mockSupabaseInstance as any);
  });

  describe("checkUserSubscription", () => {
    it("returns true for active subscription", async () => {
      const userId = "user-1";
      const mockSubscription = {
        id: "sub-1",
        status: "active",
        user_id: userId,
      };

      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest
          .fn()
          .mockResolvedValue({ data: mockSubscription, error: null }),
      };
      mockSupabaseInstance.from.mockReturnValue(mockQueryChain as any);

      const result = await actions.checkUserSubscription(userId);

      expect(result).toBe(true);
      expect(mockQueryChain.select).toHaveBeenCalledWith("status");
      expect(mockQueryChain.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockQueryChain.eq).toHaveBeenCalledWith("status", "active");
    });

    it("returns false for no active subscription", async () => {
      const userId = "user-1";

      const mockQueryChain = createMockQueryChain({ data: null, error: null });
      mockSupabaseInstance.from.mockReturnValue(mockQueryChain as any);

      const result = await actions.checkUserSubscription(userId);

      expect(result).toBe(false);
    });

    it("returns false for canceled subscription", async () => {
      const userId = "user-1";
      const mockSubscription = {
        id: "sub-1",
        status: "canceled",
        user_id: userId,
      };

      // The query should return null since we're filtering by status: 'active'
      const mockQueryChain = createMockQueryChain({ data: null, error: null });
      mockSupabaseInstance.from.mockReturnValue(mockQueryChain as any);

      const result = await actions.checkUserSubscription(userId);

      // Should return false because we're specifically looking for 'active' status
      expect(result).toBe(false);
    });

    it("handles database errors gracefully", async () => {
      const userId = "user-1";

      const mockQueryChain = createMockQueryChain({
        data: null,
        error: { message: "Database error" },
      });
      mockSupabaseInstance.from.mockReturnValue(mockQueryChain as any);

      const result = await actions.checkUserSubscription(userId);

      expect(result).toBe(false);
    });
  });

  describe("Free Plan Limit Enforcement", () => {
    it("enforces pet limits in createPetAction", async () => {
      // This test verifies that the subscription check is integrated into pet creation
      const mockUser = { id: "user-1" };
      const mockSupabaseWithAuth = {
        ...mockSupabaseInstance,
        auth: {
          getUser: jest
            .fn()
            .mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabaseWithAuth as any);

      // Mock checkUserSubscription to return false (free user)
      const mockSubscriptionChain = createMockQueryChain({ data: null, error: null });
      
      // Mock existing pets query to return 1 pet
      const mockExistingPetsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      // Make the final call resolve with existing pets data
      mockExistingPetsChain.eq.mockResolvedValue({ data: [{ id: "existing-pet" }], error: null });
      
      mockSupabaseWithAuth.from
        .mockReturnValueOnce(mockSubscriptionChain) // First call for subscription check
        .mockReturnValueOnce(mockExistingPetsChain as any); // Second call for existing pets check

      const petData = {
        name: "Second Pet",
        species: "cat",
      };

      const result = await actions.createPetAction(petData);

      expect(result).toEqual({
        error: "Free plan allows only 1 pet. Please upgrade to add more pets.",
      });
    });

    it("enforces medication limits in createMedicationAction", async () => {
      const mockUser = { id: "user-1" };
      const mockSupabaseWithAuth = {
        ...mockSupabaseInstance,
        auth: {
          getUser: jest
            .fn()
            .mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabaseWithAuth as any);

      // Mock checkUserSubscription to return false (free user)
      const mockSubscriptionChain = createMockQueryChain({ data: null, error: null });
      
      // Mock existing medications query to return 2 medications
      const mockExistingMedsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      // Make the final call resolve with existing medications data
      mockExistingMedsChain.eq.mockResolvedValue({ data: [{ id: "med-1" }, { id: "med-2" }], error: null });
      
      mockSupabaseWithAuth.from
        .mockReturnValueOnce(mockSubscriptionChain) // First call for subscription check
        .mockReturnValueOnce(mockExistingMedsChain as any); // Second call for existing meds check

      const medicationData = {
        petId: "pet-1",
        name: "Third Medication",
        dosage: "1 tablet",
        frequency: "daily",
        timing: "08:00",
      };

      const result = await actions.createMedicationAction(medicationData);

      expect(result).toEqual({
        error:
          "Free plan allows only 2 medications. Please upgrade to add more medications.",
      });
    });

    it("allows unlimited resources for subscribed users", async () => {
      const mockUser = { id: "user-1" };
      const mockSupabaseWithAuth = {
        ...mockSupabaseInstance,
        auth: {
          getUser: jest
            .fn()
            .mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabaseWithAuth as any);

      // Mock checkUserSubscription to return true (subscribed user)
      const mockSubscriptionChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { status: "active" },
          error: null,
        }),
      };
      
      // Mock existing pets check (returns empty array)
      const mockExistingPetsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      
      // Mock successful pet creation
      const mockCreatePetChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: "new-pet", name: "Buddy", species: "dog" },
          error: null,
        }),
      };
      
      mockSupabaseWithAuth.from
        .mockReturnValueOnce(mockSubscriptionChain as any) // First call for subscription check
        .mockReturnValueOnce(mockExistingPetsChain as any) // Second call for existing pets check  
        .mockReturnValueOnce(mockCreatePetChain as any); // Third call for pet creation

      const petData = {
        name: "Buddy",
        species: "dog",
      };

      const result = await actions.createPetAction(petData);

      expect(result).toEqual({ success: true, data: { id: "new-pet", name: "Buddy", species: "dog" } });
    });
  });
});
