import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReminderCard from "@/components/reminder-card";
import * as actions from "@/app/actions";

// Mock the actions
jest.mock("@/app/actions", () => ({
  markReminderAsGivenAction: jest.fn(),
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

const mockActions = actions as jest.Mocked<typeof actions>;

describe("ReminderCard", () => {
  const mockOnMarkAsGiven = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockActions.markReminderAsGivenAction.mockResolvedValue({
      success: true,
      data: {},
    });
  });

  const createMockReminder = (overrides = {}) => ({
    id: "1",
    scheduled_time: new Date().toISOString(),
    status: "pending",
    pets: { name: "Buddy", species: "Dog" },
    medications: { name: "Heartgard Plus", dosage: "1 tablet" },
    ...overrides,
  });

  it("renders reminder information correctly", () => {
    const reminder = createMockReminder();
    render(
      <ReminderCard reminder={reminder} onMarkAsGiven={mockOnMarkAsGiven} />,
    );

    expect(screen.getByText("Buddy")).toBeInTheDocument();
    expect(screen.getByText("Heartgard Plus")).toBeInTheDocument();
    expect(screen.getByText("1 tablet")).toBeInTheDocument();
  });

  it("shows correct status for pending reminder", () => {
    // Create a reminder scheduled for 3 hours in the future to ensure it shows as "Scheduled"
    const futureTime = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    const reminder = createMockReminder({ 
      status: "pending",
      scheduled_time: futureTime
    });
    render(
      <ReminderCard reminder={reminder} onMarkAsGiven={mockOnMarkAsGiven} />,
    );

    expect(screen.getByText("📅 Scheduled")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /mark as given/i }),
    ).toBeInTheDocument();
  });

  it("shows correct status for overdue reminder", () => {
    const overdueTime = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
    const reminder = createMockReminder({
      scheduled_time: overdueTime,
      status: "pending",
    });
    render(
      <ReminderCard reminder={reminder} onMarkAsGiven={mockOnMarkAsGiven} />,
    );

    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
    expect(screen.getByText(/min late/i)).toBeInTheDocument();
  });

  it("shows correct status for due now reminder", () => {
    const dueNowTime = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now
    const reminder = createMockReminder({
      scheduled_time: dueNowTime,
      status: "pending",
    });
    render(
      <ReminderCard reminder={reminder} onMarkAsGiven={mockOnMarkAsGiven} />,
    );

    expect(screen.getByText(/due now/i)).toBeInTheDocument();
  });

  it("shows correct status for upcoming reminder", () => {
    const upcomingTime = new Date(Date.now() + 90 * 60 * 1000).toISOString(); // 90 minutes from now
    const reminder = createMockReminder({
      scheduled_time: upcomingTime,
      status: "pending",
    });
    render(
      <ReminderCard reminder={reminder} onMarkAsGiven={mockOnMarkAsGiven} />,
    );

    expect(screen.getByText(/due soon/i)).toBeInTheDocument();
    expect(screen.getByText(/in \d+ min/i)).toBeInTheDocument();
  });

  it("shows completed status for given reminder", () => {
    const reminder = createMockReminder({ status: "given" });
    render(
      <ReminderCard reminder={reminder} onMarkAsGiven={mockOnMarkAsGiven} />,
    );

    expect(screen.getByText(/given/i)).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /mark as given/i }),
    ).not.toBeInTheDocument();
  });

  it("marks reminder as given when button is clicked", async () => {
    const user = userEvent.setup();
    const reminder = createMockReminder();
    render(
      <ReminderCard reminder={reminder} onMarkAsGiven={mockOnMarkAsGiven} />,
    );

    const markButton = screen.getByRole("button", { name: /mark as given/i });
    await user.click(markButton);

    await waitFor(() => {
      expect(mockActions.markReminderAsGivenAction).toHaveBeenCalledWith("1");
    });

    expect(mockOnMarkAsGiven).toHaveBeenCalled();
  });

  it("shows loading state when marking as given", async () => {
    const user = userEvent.setup();
    // Make the action take some time to resolve
    mockActions.markReminderAsGivenAction.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true, data: {} }), 100),
        ),
    );

    const reminder = createMockReminder();
    render(
      <ReminderCard reminder={reminder} onMarkAsGiven={mockOnMarkAsGiven} />,
    );

    const markButton = screen.getByRole("button", { name: /mark as given/i });
    await user.click(markButton);

    expect(screen.getByText("Marking...")).toBeInTheDocument();
  });

  it("applies correct border colors based on status", () => {
    const { container, rerender } = render(
      <ReminderCard
        reminder={createMockReminder({ status: "given" })}
        onMarkAsGiven={mockOnMarkAsGiven}
      />,
    );

    let card = container.querySelector('[class*="border-green-200"]');
    expect(card).toBeInTheDocument();

    // Test overdue status
    const overdueTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    rerender(
      <ReminderCard
        reminder={createMockReminder({
          scheduled_time: overdueTime,
          status: "pending",
        })}
        onMarkAsGiven={mockOnMarkAsGiven}
      />,
    );

    card = container.querySelector('[class*="border-red-300"]');
    expect(card).toBeInTheDocument();
  });

  it("displays scheduled time correctly", () => {
    const scheduledTime = new Date("2024-01-15T14:30:00Z");
    const reminder = createMockReminder({
      scheduled_time: scheduledTime.toISOString(),
    });

    render(
      <ReminderCard reminder={reminder} onMarkAsGiven={mockOnMarkAsGiven} />,
    );

    // Should display time in local format
    const timeText = scheduledTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    expect(screen.getByText(timeText)).toBeInTheDocument();
  });

  it("handles errors when marking as given", async () => {
    const user = userEvent.setup();
    mockActions.markReminderAsGivenAction.mockRejectedValue(
      new Error("Network error"),
    );

    const reminder = createMockReminder();
    render(
      <ReminderCard reminder={reminder} onMarkAsGiven={mockOnMarkAsGiven} />,
    );

    const markButton = screen.getByRole("button", { name: /mark as given/i });
    await user.click(markButton);

    // Should handle error gracefully and not crash
    await waitFor(() => {
      expect(markButton).not.toBeDisabled();
    });
  });
});
