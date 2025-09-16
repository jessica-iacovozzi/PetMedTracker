import * as actions from "@/app/actions";
import { createClient } from "../../../supabase/server";

// Mock Supabase server client
jest.mock("../../../supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = jest.mocked(createClient);

describe("Reminders Service", () => {
  const mockUser = { id: "user-1" };
  const mockSupabaseInstance = {
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue(mockSupabaseInstance as any);
  });

  describe("getTodaysRemindersAction", () => {
    it("retrieves today's reminders successfully", async () => {
      const mockReminders = [
        {
          id: "reminder-1",
          scheduled_time: new Date().toISOString(),
          status: "pending",
          pets: { name: "Buddy", species: "Dog" },
          medications: { name: "Heartgard Plus", dosage: "1 tablet" },
        },
        {
          id: "reminder-2",
          scheduled_time: new Date().toISOString(),
          status: "given",
          pets: { name: "Whiskers", species: "Cat" },
          medications: { name: "Revolution", dosage: "0.75ml" },
        },
      ];

      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      mockQueryChain.order.mockResolvedValue({
        data: mockReminders,
        error: null,
      });
      mockSupabaseInstance.from.mockReturnValue(mockQueryChain as any);

      const result = await actions.getTodaysRemindersAction();

      expect(result).toEqual({ success: true, data: mockReminders });
      expect(mockQueryChain.select).toHaveBeenCalledWith(
        expect.stringContaining("pets"),
      );
      expect(mockQueryChain.select).toHaveBeenCalledWith(
        expect.stringContaining("medications"),
      );
    });

    it("filters reminders by date range correctly", async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      mockQueryChain.order.mockResolvedValue({ data: [], error: null });
      mockSupabaseInstance.from.mockReturnValue(mockQueryChain as any);

      await actions.getTodaysRemindersAction();

      // Should filter by today's date range
      expect(mockQueryChain.gte).toHaveBeenCalledWith(
        "scheduled_time",
        expect.any(String),
      );
      expect(mockQueryChain.lt).toHaveBeenCalledWith(
        "scheduled_time",
        expect.any(String),
      );
    });

    it("handles query errors", async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      mockQueryChain.order.mockResolvedValue({
        data: null,
        error: { message: "Query failed" },
      });
      mockSupabaseInstance.from.mockReturnValue(mockQueryChain as any);

      const result = await actions.getTodaysRemindersAction();

      expect(result).toEqual({ error: "Query failed" });
    });

    it("requires authentication", async () => {
      mockSupabaseInstance.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await actions.getTodaysRemindersAction();

      expect(result).toEqual({ error: "User not authenticated" });
    });
  });

  describe("markReminderAsGivenAction", () => {
    it("marks reminder as given successfully", async () => {
      const reminderId = "reminder-1";
      const mockUpdatedReminder = {
        id: reminderId,
        status: "given",
        pet_id: "pet-1",
        medication_id: "med-1",
        scheduled_time: new Date().toISOString(),
      };

      // Mock the reminder update
      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest
          .fn()
          .mockResolvedValue({ data: mockUpdatedReminder, error: null }),
      };

      // Mock the history insert
      const mockInsertChain = {
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabaseInstance.from
        .mockReturnValueOnce(mockUpdateChain as any) // First call for reminders
        .mockReturnValueOnce(mockInsertChain as any); // Second call for history

      const result = await actions.markReminderAsGivenAction(reminderId);

      expect(result).toEqual({ success: true, data: mockUpdatedReminder });
      expect(mockUpdateChain.update).toHaveBeenCalledWith({ status: "given" });
      expect(mockInsertChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          pet_id: "pet-1",
          medication_id: "med-1",
          status: "given",
        }),
      );
    });

    it("handles update errors", async () => {
      const reminderId = "reminder-1";

      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Reminder not found" },
        }),
      };
      mockSupabaseInstance.from.mockReturnValue(mockUpdateChain as any);

      const result = await actions.markReminderAsGivenAction(reminderId);

      expect(result).toEqual({ error: "Reminder not found" });
    });

    it("continues even if history logging fails", async () => {
      const reminderId = "reminder-1";
      const mockUpdatedReminder = {
        id: reminderId,
        status: "given",
        pet_id: "pet-1",
        medication_id: "med-1",
        scheduled_time: new Date().toISOString(),
      };

      // Mock successful reminder update
      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest
          .fn()
          .mockResolvedValue({ data: mockUpdatedReminder, error: null }),
      };

      // Mock failed history insert
      const mockInsertChain = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "History insert failed" },
        }),
      };

      mockSupabaseInstance.from
        .mockReturnValueOnce(mockUpdateChain as any)
        .mockReturnValueOnce(mockInsertChain as any);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await actions.markReminderAsGivenAction(reminderId);

      expect(result).toEqual({ success: true, data: mockUpdatedReminder });
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to add to history:",
        expect.any(Object),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("getHistoryAction", () => {
    it("retrieves history with optional filters", async () => {
      const mockHistory = [
        {
          id: "history-1",
          scheduled_time: new Date().toISOString(),
          status: "given",
          pets: { name: "Buddy", species: "Dog" },
          medications: { name: "Heartgard Plus", dosage: "1 tablet" },
        },
      ];

      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      mockQueryChain.order.mockResolvedValue({
        data: mockHistory,
        error: null,
      });
      mockSupabaseInstance.from.mockReturnValue(mockQueryChain as any);

      const result = await actions.getHistoryAction(
        "pet-1",
        "2024-01-01",
        "2024-01-31",
      );

      expect(result).toEqual({ success: true, data: mockHistory });
      expect(mockQueryChain.eq).toHaveBeenCalledWith("pet_id", "pet-1");
      expect(mockQueryChain.gte).toHaveBeenCalledWith(
        "scheduled_time",
        "2024-01-01",
      );
      expect(mockQueryChain.lte).toHaveBeenCalledWith(
        "scheduled_time",
        "2024-01-31",
      );
    });

    it("works without optional filters", async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      mockQueryChain.order.mockResolvedValue({ data: [], error: null });
      mockSupabaseInstance.from.mockReturnValue(mockQueryChain as any);

      const result = await actions.getHistoryAction();

      expect(result).toEqual({ success: true, data: [] });
      // Should only call eq once for user_id, not for pet_id or date filters
      expect(mockQueryChain.eq).toHaveBeenCalledTimes(1);
      expect(mockQueryChain.eq).toHaveBeenCalledWith("user_id", "user-1");
    });
  });
});
