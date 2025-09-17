import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PetProfileForm from "@/components/pet-profile-form";
import * as actions from "@/app/actions";

// Mock the actions
jest.mock("@/app/actions", () => ({
  createPetAction: jest.fn(),
  updatePetAction: jest.fn(),
  checkUserSubscription: jest.fn(),
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock window.location.href to prevent navigation errors in JSDOM
Object.defineProperty(window, "location", {
  value: {
    href: "",
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  writable: true,
});

// Mock FileReader for photo upload tests
(global as any).FileReader = class {
  result: string | ArrayBuffer | null = null;
  error = null;
  readyState = 0;
  onload: any = null;

  readAsDataURL() {
    this.result = "data:image/jpeg;base64,mockbase64data";
    this.readyState = 2;
    if (this.onload) {
      setTimeout(() => this.onload({ target: this }), 0);
    }
  }

  readAsText() {}
  readAsArrayBuffer() {}
  abort() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return true;
  }
};

const mockActions = actions as jest.Mocked<typeof actions>;

describe("PetProfileForm", () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockActions.createPetAction.mockResolvedValue({ success: true, data: {} });
    mockActions.updatePetAction.mockResolvedValue({ success: true, data: {} });
    mockActions.checkUserSubscription.mockResolvedValue(false);

    // Reset window.location.href mock
    (window.location as any).href = "";
  });

  it("renders form fields correctly", () => {
    render(
      <PetProfileForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />,
    );

    expect(screen.getByLabelText(/pet name/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/species/i)[0]).toBeInTheDocument();
    expect(screen.getByLabelText(/breed/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add pet/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(
      <PetProfileForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />,
    );

    const submitButton = screen.getByRole("button", { name: /add pet/i });
    await user.click(submitButton);

    // Form should not submit without required fields
    expect(mockActions.createPetAction).not.toHaveBeenCalled();
  });

  it("creates a new pet successfully", async () => {
    const user = userEvent.setup();
    render(
      <PetProfileForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />,
    );

    // Fill in required fields
    await user.type(screen.getByLabelText(/pet name/i), "Buddy");

    // Click on the select trigger to open dropdown
    const selectTrigger = screen.getByRole("combobox");
    await user.click(selectTrigger);

    // Wait for options to appear and click on dog option
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Dog" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("option", { name: "Dog" }));

    // Submit form
    await user.click(screen.getByRole("button", { name: /add pet/i }));

    await waitFor(() => {
      expect(mockActions.createPetAction).toHaveBeenCalledWith({
        name: "Buddy",
        species: "dog",
        breed: "",
        age: "",
        weight: "",
        photo: "",
      });
    });

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("shows upgrade modal when free plan limit is reached", async () => {
    const user = userEvent.setup();
    mockActions.createPetAction.mockResolvedValue({
      error: "Free plan allows only 1 pet. Please upgrade to add more pets.",
    });

    render(
      <PetProfileForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />,
    );

    // Fill in required fields
    await user.type(screen.getByLabelText(/pet name/i), "Buddy");
    const selectTrigger = screen.getByRole("combobox");
    await user.click(selectTrigger);
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Dog" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("option", { name: "Dog" }));

    // Submit form
    await user.click(screen.getByRole("button", { name: /add pet/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /upgrade to premium/i }),
      ).toBeInTheDocument();
    });
  });

  it("updates existing pet when in edit mode", async () => {
    const user = userEvent.setup();
    const existingPet = {
      id: "1",
      name: "Buddy",
      species: "dog",
      breed: "Golden Retriever",
      age: "3 years",
      weight: "65 lbs",
    };

    render(
      <PetProfileForm
        pet={existingPet}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />,
    );

    // Verify form is pre-filled
    expect(screen.getByDisplayValue("Buddy")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Golden Retriever")).toBeInTheDocument();

    // Update name
    const nameInput = screen.getByLabelText(/pet name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Max");

    // Submit form
    await user.click(screen.getByRole("button", { name: /update pet/i }));

    await waitFor(() => {
      expect(mockActions.updatePetAction).toHaveBeenCalledWith("1", {
        name: "Max",
        species: "dog",
        breed: "Golden Retriever",
        age: "3 years",
        weight: "65 lbs",
        photo: "",
      });
    });
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <PetProfileForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />,
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("displays error messages", async () => {
    const user = userEvent.setup();
    mockActions.createPetAction.mockResolvedValue({
      error: "Database error occurred",
    });

    render(
      <PetProfileForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />,
    );

    // Fill in required fields and submit
    await user.type(screen.getByLabelText(/pet name/i), "Buddy");
    const selectTrigger = screen.getByRole("combobox");
    await user.click(selectTrigger);

    // Wait for the select content to be rendered
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Dog" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("option", { name: "Dog" }));
    await user.click(screen.getByRole("button", { name: /add pet/i }));

    await waitFor(() => {
      expect(screen.getByText("Database error occurred")).toBeInTheDocument();
    });
  });
});
