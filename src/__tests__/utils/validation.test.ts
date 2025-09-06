import { encodedRedirect } from "@/utils/utils";

// Mock Next.js redirect
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import { redirect } from "next/navigation";
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

describe("Validation Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("encodedRedirect", () => {
    it("redirects with encoded error message", () => {
      const path = "/sign-in";
      const message = "Invalid credentials";

      encodedRedirect("error", path, message);

      expect(mockRedirect).toHaveBeenCalledWith(
        "/sign-in?error=Invalid%20credentials",
      );
    });

    it("redirects with encoded success message", () => {
      const path = "/dashboard";
      const message = "Profile updated successfully";

      encodedRedirect("success", path, message);

      expect(mockRedirect).toHaveBeenCalledWith(
        "/dashboard?success=Profile%20updated%20successfully",
      );
    });

    it("properly encodes special characters", () => {
      const path = "/settings";
      const message = "Error: Something went wrong & needs attention!";

      encodedRedirect("error", path, message);

      expect(mockRedirect).toHaveBeenCalledWith(
        "/settings?error=Error%3A%20Something%20went%20wrong%20%26%20needs%20attention!",
      );
    });

    it("handles empty messages", () => {
      const path = "/home";
      const message = "";

      encodedRedirect("success", path, message);

      expect(mockRedirect).toHaveBeenCalledWith("/home?success=");
    });
  });
});

// Additional validation helper functions for testing
export const validatePetData = (petData: any) => {
  const errors: string[] = [];

  if (!petData.name || petData.name.trim().length === 0) {
    errors.push("Pet name is required");
  }

  if (!petData.species || petData.species.trim().length === 0) {
    errors.push("Species is required");
  }

  if (petData.name && petData.name.length > 50) {
    errors.push("Pet name must be less than 50 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateMedicationData = (medicationData: any) => {
  const errors: string[] = [];

  if (!medicationData.petId) {
    errors.push("Pet selection is required");
  }

  if (!medicationData.name || medicationData.name.trim().length === 0) {
    errors.push("Medication name is required");
  }

  if (!medicationData.dosage || medicationData.dosage.trim().length === 0) {
    errors.push("Dosage is required");
  }

  if (!medicationData.frequency) {
    errors.push("Frequency is required");
  }

  if (!medicationData.timing) {
    errors.push("Timing is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Test the validation functions
describe("Pet Data Validation", () => {
  it("validates pet data correctly", () => {
    const validPet = {
      name: "Buddy",
      species: "dog",
    };

    const result = validatePetData(validPet);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("catches missing required fields", () => {
    const invalidPet = {
      name: "",
      species: "",
    };

    const result = validatePetData(invalidPet);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Pet name is required");
    expect(result.errors).toContain("Species is required");
  });

  it("validates name length", () => {
    const invalidPet = {
      name: "A".repeat(51), // 51 characters
      species: "dog",
    };

    const result = validatePetData(invalidPet);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Pet name must be less than 50 characters");
  });
});

describe("Medication Data Validation", () => {
  it("validates medication data correctly", () => {
    const validMedication = {
      petId: "pet-1",
      name: "Heartgard Plus",
      dosage: "1 tablet",
      frequency: "daily",
      timing: "08:00",
    };

    const result = validateMedicationData(validMedication);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("catches missing required fields", () => {
    const invalidMedication = {
      petId: "",
      name: "",
      dosage: "",
      frequency: "",
      timing: "",
    };

    const result = validateMedicationData(invalidMedication);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Pet selection is required");
    expect(result.errors).toContain("Medication name is required");
    expect(result.errors).toContain("Dosage is required");
    expect(result.errors).toContain("Frequency is required");
    expect(result.errors).toContain("Timing is required");
  });
});
