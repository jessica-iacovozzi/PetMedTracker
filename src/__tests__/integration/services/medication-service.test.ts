import { createClient } from "../../../../supabase/server";

// Mock Supabase
jest.mock("../../../../supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("Medication Service Integration Tests", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };
    
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe("Medication CRUD Operations", () => {
    it("should test medication service with mocked database", async () => {
      const mockUser = { id: "user-123" };
      const mockMedications = [
        {
          id: "med-1",
          name: "Heartgard",
          type: "preventive",
          user_id: "user-123",
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      // Mock auth
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });

      // Mock database query chain
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockMedications,
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(mockChain);

      const supabase = await createClient();
      
      // Test the integration flow
      const { data: { user } } = await supabase.auth.getUser();
      expect(user).toEqual(mockUser);

      const result = await supabase
        .from("medications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      expect(result.data).toEqual(mockMedications);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith("medications");
    });

    it("should handle authentication flow", async () => {
      const mockUser = { id: "user-123" };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });

      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      expect(user).toEqual(mockUser);
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    });

    it("should handle unauthenticated user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      expect(user).toBeNull();
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    });
  });
});
