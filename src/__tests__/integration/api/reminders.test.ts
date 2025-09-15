import { NextRequest } from "next/server";
import { POST } from "@/app/api/reminders/route";
import { createClient } from "../../../../supabase/server";

// Mock Supabase
jest.mock("../../../../supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("/api/reminders Integration Tests", () => {
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

  describe("POST /api/reminders", () => {
    it("should create a reminder successfully with valid data", async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      });

      // Mock successful database insert
      const mockReminderData = {
        id: "reminder-123",
        user_id: "user-123",
        pet_id: "pet-123",
        medication_id: "med-123",
        scheduled_time: "2024-01-01T10:00:00Z",
        status: "pending",
      };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockReminderData,
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(mockChain);

      const request = new NextRequest("http://localhost/api/reminders", {
        method: "POST",
        body: JSON.stringify({
          petId: "pet-123",
          medicationId: "med-123",
          scheduledTime: "2024-01-01T10:00:00Z",
          frequency: "daily",
          dosage: "1 pill",
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(mockReminderData);
    });

    it("should return 401 for unauthenticated user", async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const request = new NextRequest("http://localhost/api/reminders", {
        method: "POST",
        body: JSON.stringify({
          petId: "pet-123",
          medicationId: "med-123",
          scheduledTime: "2024-01-01T10:00:00Z",
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe("Unauthorized");
    });

    it("should return 400 for missing required fields", async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      });

      const request = new NextRequest("http://localhost/api/reminders", {
        method: "POST",
        body: JSON.stringify({
          petId: "pet-123",
          // Missing medicationId and scheduledTime
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe("Missing required fields");
    });

    it("should return 500 for database errors", async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      });

      // Mock database error
      const mockErrorChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database connection failed" },
        }),
      };
      mockSupabase.from.mockReturnValue(mockErrorChain);

      const request = new NextRequest("http://localhost/api/reminders", {
        method: "POST",
        body: JSON.stringify({
          petId: "pet-123",
          medicationId: "med-123",
          scheduledTime: "2024-01-01T10:00:00Z",
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe("Database connection failed");
    });
  });
});
