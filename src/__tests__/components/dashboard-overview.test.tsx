import { render, screen } from "@testing-library/react";
import DashboardOverview from "@/components/dashboard-overview";

// Mock Next.js Link component
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

describe("DashboardOverview", () => {
  const mockPets = [
    {
      id: "1",
      name: "Buddy",
      species: "Dog",
      user_id: "user-1",
      breed: undefined,
      age: undefined,
      weight: undefined,
      photo: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      medications: [
        {
          id: "1",
          name: "Heartgard Plus",
          dosage: "1 tablet",
          frequency: "daily",
          timing: "08:00",
          duration: undefined,
          created_at: new Date().toISOString(),
          status: "due" as const,
        },
        {
          id: "2",
          name: "Apoquel",
          dosage: "16mg",
          frequency: "daily",
          timing: "12:00",
          duration: undefined,
          created_at: new Date().toISOString(),
          status: "due" as const,
        },
      ],
    },
    {
      id: "2",
      name: "Whiskers",
      species: "Cat",
      user_id: "user-1",
      breed: undefined,
      age: undefined,
      weight: undefined,
      photo: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      medications: [
        {
          id: "3",
          name: "Revolution",
          dosage: "0.75ml",
          frequency: "monthly",
          timing: "09:00",
          duration: undefined,
          created_at: new Date().toISOString(),
          status: "due" as const,
        },
      ],
    },
  ];

  const mockReminders = [
    {
      id: "1",
      scheduled_time: new Date().toISOString(),
      status: "pending",
      pets: { name: "Buddy", species: "Dog" },
      medications: { name: "Heartgard Plus", dosage: "1 tablet" },
    },
    {
      id: "2",
      scheduled_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago (definitely overdue)
      status: "pending",
      pets: { name: "Whiskers", species: "Cat" },
      medications: { name: "Revolution", dosage: "0.75ml" },
    },
    {
      id: "3",
      scheduled_time: new Date().toISOString(),
      status: "given",
      pets: { name: "Buddy", species: "Dog" },
      medications: { name: "Apoquel", dosage: "16mg" },
    },
  ];

  it("renders dashboard header correctly", () => {
    render(
      <DashboardOverview pets={mockPets} todaysReminders={mockReminders} />,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(
      screen.getByText("Manage your pets' medication schedules"),
    ).toBeInTheDocument();
  });

  it("displays correct statistics", () => {
    render(
      <DashboardOverview pets={mockPets} todaysReminders={mockReminders} />,
    );

    // Total pets - check for specific stat card content
    const totalPetsSection = screen.getByText("Total Pets").closest('.p-6');
    expect(totalPetsSection).toBeInTheDocument();
    expect(totalPetsSection).toHaveTextContent("Total Pets");
    expect(totalPetsSection).toHaveTextContent("2");

    // Active medications - check for specific stat card content
    const activeMedsSection = screen.getByText("Active Medications").closest('.p-6');
    expect(activeMedsSection).toBeInTheDocument();
    expect(activeMedsSection).toHaveTextContent("Active Medications");
    expect(activeMedsSection).toHaveTextContent("3");

    // Check that we have the expected number of pets and medications
    expect(screen.getByText("2 pets")).toBeInTheDocument();
  });

  it("shows overdue alert when there are overdue medications", () => {
    // Create specific test data with guaranteed overdue reminder
    const overdueReminders = [
      {
        id: "1",
        scheduled_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        status: "pending",
        pets: { name: "Buddy", species: "Dog" },
        medications: { name: "Heartgard Plus", dosage: "1 tablet" },
      },
    ];

    render(
      <DashboardOverview pets={mockPets} todaysReminders={overdueReminders} />,
    );

    // Check for overdue count in stats card
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    // Check for overdue alert banner
    expect(screen.getByText(/medication overdue/)).toBeInTheDocument();
    expect(screen.getByText(/past their scheduled time/)).toBeInTheDocument();
  });

  it("displays today's medication schedule", () => {
    render(
      <DashboardOverview pets={mockPets} todaysReminders={mockReminders} />,
    );

    expect(screen.getByText("Today's Medication Schedule")).toBeInTheDocument();
    expect(screen.getByText("3 total")).toBeInTheDocument();
    expect(screen.getByText("1 given")).toBeInTheDocument();
    expect(screen.getByText("2 pending")).toBeInTheDocument();
  });

  it("groups reminders by time periods", () => {
    render(
      <DashboardOverview pets={mockPets} todaysReminders={mockReminders} />,
    );

    // Should show time period headers based on reminder times
    const timeHeaders = screen.getAllByText(/morning|afternoon|evening/i);
    expect(timeHeaders.length).toBeGreaterThan(0);
  });

  it("displays pets grid", () => {
    render(
      <DashboardOverview pets={mockPets} todaysReminders={mockReminders} />,
    );

    expect(screen.getByText("Your Pets")).toBeInTheDocument();
    expect(screen.getByText("2 pets")).toBeInTheDocument();
  });

  it("shows empty state when no pets exist", () => {
    render(<DashboardOverview pets={[]} todaysReminders={[]} />);

    expect(screen.getByText("No pets added yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Start by adding your first pet to track their medications.",
      ),
    ).toBeInTheDocument();
  });

  it("shows empty state when no reminders for today", () => {
    render(<DashboardOverview pets={mockPets} todaysReminders={[]} />);

    expect(screen.getByText("No medications due today!")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your pets are all set for today. Great job staying on top of their care!",
      ),
    ).toBeInTheDocument();
  });

  it("displays action buttons", () => {
    render(
      <DashboardOverview pets={mockPets} todaysReminders={mockReminders} />,
    );

    expect(screen.getByRole("link", { name: /add pet/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /add medication/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /upgrade to premium/i }),
    ).toBeInTheDocument();
  });

  it("calculates upcoming reminders correctly", () => {
    const upcomingTime = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes from now
    const remindersWithUpcoming = [
      ...mockReminders,
      {
        id: "4",
        scheduled_time: upcomingTime,
        status: "pending",
        pets: { name: "Buddy", species: "Dog" },
        medications: { name: "Test Med", dosage: "1 pill" },
      },
    ];

    render(
      <DashboardOverview
        pets={mockPets}
        todaysReminders={remindersWithUpcoming}
      />,
    );

    // Should show upcoming count in stats
    expect(screen.getByText("Upcoming (2hrs)")).toBeInTheDocument();
  });
});
