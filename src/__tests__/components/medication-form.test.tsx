import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MedicationForm from "@/components/medication-form";
import * as actions from "@/app/actions";

// Mock the actions
jest.mock("@/app/actions", () => ({
  createMedicationAction: jest.fn(),
  updateMedicationAction: jest.fn(),
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

const mockActions = actions as jest.Mocked<typeof actions>;

describe("MedicationForm", () => {
  const mockPets = [
    { id: "1", name: "Buddy", species: "Dog" },
    { id: "2", name: "Whiskers", species: "Cat" },
  ];
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockActions.createMedicationAction.mockResolvedValue({
      success: true,
      data: {},
    });
    mockActions.updateMedicationAction.mockResolvedValue({
      success: true,
      data: {},
    });
  });

  it("renders form fields correctly", () => {
    render(
      <MedicationForm
        pets={mockPets}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />,
    );

    expect(screen.getByLabelText(/select pet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/medication name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dosage/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/time of day/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add medication/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(
      <MedicationForm
        pets={mockPets}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />,
    );

    const submitButton = screen.getByRole("button", {
      name: /add medication/i,
    });
    await user.click(submitButton);

    // Form should not submit without required fields
    expect(mockActions.createMedicationAction).not.toHaveBeenCalled();
  });

  it("creates a new medication successfully", async () => {
    const user = userEvent.setup();
    render(
      <MedicationForm
        pets={mockPets}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />,
    );

    // Fill in required fields
    const petSelect = screen.getByLabelText(/select pet/i);
    await user.click(petSelect);
    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: /buddy \(dog\)/i }),
      ).toBeInTheDocument();
    });
    await user.click(screen.getByRole("option", { name: /buddy \(dog\)/i }));

    await user.type(
      screen.getByLabelText(/medication name/i),
      "Heartgard Plus",
    );
    await user.type(screen.getByLabelText(/dosage/i), "1 tablet");

    const frequencySelect = screen.getByLabelText(/frequency/i);
    await user.click(frequencySelect);
    await waitFor(() => {
      expect(
        screen.getAllByRole("option", { name: /daily/i })[0],
      ).toBeInTheDocument();
    });
    await user.click(screen.getAllByRole("option", { name: /daily/i })[0]);

    await user.type(screen.getByLabelText(/time of day/i), "08:00");

    // Submit form
    await user.click(screen.getByRole("button", { name: /add medication/i }));

    await waitFor(() => {
      expect(mockActions.createMedicationAction).toHaveBeenCalledWith({
        petId: "1",
        name: "Heartgard Plus",
        dosage: "1 tablet",
        frequency: "daily",
        timing: "08:00",
        duration: "",
      });
    });

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("shows upgrade modal when free plan limit is reached", async () => {
    const user = userEvent.setup();
    mockActions.createMedicationAction.mockResolvedValue({
      error:
        "Free plan allows only 2 medications. Please upgrade to add more medications.",
    });

    render(
      <MedicationForm
        pets={mockPets}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />,
    );

    // Fill in required fields and submit
    const petSelect = screen.getByLabelText(/select pet/i);
    await user.click(petSelect);
    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: /buddy \(dog\)/i }),
      ).toBeInTheDocument();
    });
    await user.click(screen.getByRole("option", { name: /buddy \(dog\)/i }));

    await user.type(
      screen.getByLabelText(/medication name/i),
      "Heartgard Plus",
    );
    await user.type(screen.getByLabelText(/dosage/i), "1 tablet");

    const frequencySelect = screen.getByLabelText(/frequency/i);
    await user.click(frequencySelect);
    await waitFor(() => {
      expect(
        screen.getAllByRole("option", { name: /daily/i })[0],
      ).toBeInTheDocument();
    });
    await user.click(screen.getAllByRole("option", { name: /daily/i })[0]);

    await user.type(screen.getByLabelText(/time of day/i), "08:00");
    await user.click(screen.getByRole("button", { name: /add medication/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /upgrade to premium/i }),
      ).toBeInTheDocument();
    });
  });

  it("updates existing medication when in edit mode", async () => {
    const user = userEvent.setup();
    const existingMedication = {
      id: "1",
      pet_id: "1",
      name: "Heartgard Plus",
      dosage: "1 tablet",
      frequency: "daily",
      timing: "08:00",
      duration: "30 days",
    };

    render(
      <MedicationForm
        medication={existingMedication}
        pets={mockPets}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />,
    );

    // Verify form is pre-filled
    expect(screen.getByDisplayValue("Heartgard Plus")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1 tablet")).toBeInTheDocument();

    // Update dosage
    const dosageInput = screen.getByLabelText(/dosage/i);
    await user.clear(dosageInput);
    await user.type(dosageInput, "2 tablets");

    // Submit form
    await user.click(
      screen.getByRole("button", { name: /update medication/i }),
    );

    await waitFor(() => {
      expect(mockActions.updateMedicationAction).toHaveBeenCalledWith("1", {
        petId: "1",
        name: "Heartgard Plus",
        dosage: "2 tablets",
        frequency: "daily",
        timing: "08:00",
        duration: "30 days",
      });
    });
  });

  it("toggles reminder settings", async () => {
    const user = userEvent.setup();
    render(
      <MedicationForm
        pets={mockPets}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />,
    );

    const reminderSwitch = screen.getByLabelText(/enable reminders/i);
    expect(reminderSwitch).toBeChecked();

    await user.click(reminderSwitch);
    expect(reminderSwitch).not.toBeChecked();

    // Reminder time field should be hidden
    expect(screen.queryByLabelText(/reminder time/i)).not.toBeInTheDocument();
  });

  it("displays error messages", async () => {
    const user = userEvent.setup();
    mockActions.createMedicationAction.mockResolvedValue({
      error: "Database error occurred",
    });

    render(
      <MedicationForm
        pets={mockPets}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />,
    );

    // Fill in required fields and submit
    const petSelect = screen.getByLabelText(/select pet/i);
    await user.click(petSelect);
    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: /buddy \(dog\)/i }),
      ).toBeInTheDocument();
    });
    await user.click(screen.getByRole("option", { name: /buddy \(dog\)/i }));

    await user.type(
      screen.getByLabelText(/medication name/i),
      "Heartgard Plus",
    );
    await user.type(screen.getByLabelText(/dosage/i), "1 tablet");

    const frequencySelect = screen.getByLabelText(/frequency/i);
    await user.click(frequencySelect);
    await waitFor(() => {
      expect(
        screen.getAllByRole("option", { name: /daily/i })[0],
      ).toBeInTheDocument();
    });
    await user.click(screen.getAllByRole("option", { name: /daily/i })[0]);

    await user.type(screen.getByLabelText(/time of day/i), "08:00");
    await user.click(screen.getByRole("button", { name: /add medication/i }));

    await waitFor(() => {
      expect(screen.getByText("Database error occurred")).toBeInTheDocument();
    });
  });
});
