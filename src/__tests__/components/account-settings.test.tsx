import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountSettings from "@/components/account-settings";
import * as actions from "@/app/actions";

// Mock the actions
jest.mock("@/app/actions", () => ({
  updateProfileAction: jest.fn(),
  updateNotificationPreferencesAction: jest.fn(),
}));

const mockActions = actions as jest.Mocked<typeof actions>;

// Mock Supabase client
const mockSupabaseInvoke = jest.fn();
jest.mock("../../supabase/client", () => ({
  createClient: () => ({
    functions: {
      invoke: mockSupabaseInvoke,
    },
  }),
}));

describe("AccountSettings", () => {
  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    user_metadata: {},
    app_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: undefined,
    confirmation_sent_at: undefined,
    recovery_sent_at: undefined,
    email_change_sent_at: undefined,
    new_email: undefined,
    invited_at: undefined,
    action_link: undefined,
    email_change: undefined,
    phone: undefined,
    phone_change: undefined,
    phone_change_sent_at: undefined,
    confirmed_at: new Date().toISOString(),
    email_change_confirm_status: 0,
    banned_until: undefined,
    deleted_at: undefined,
    is_anonymous: false,
    role: "authenticated",
    last_sign_in_at: new Date().toISOString(),
    identities: [],
    factors: [],
  };

  const mockUserProfile = {
    id: "user-1",
    name: "John Doe",
    email: "test@example.com",
  };

  const mockNotificationPrefs = {
    email_enabled: true,
    push_enabled: false,
  };

  const mockSubscription = {
    status: "active",
    amount: 500, // $5.00
    interval: "month",
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockActions.updateProfileAction.mockResolvedValue({ success: true });
    mockActions.updateNotificationPreferencesAction.mockResolvedValue({
      success: true,
      data: {},
    });
    mockSupabaseInvoke.mockResolvedValue({
      data: { url: "https://billing.stripe.com/session/123" },
    });
  });

  it("renders all sections correctly", () => {
    render(
      <AccountSettings
        user={mockUser}
        userProfile={mockUserProfile}
        notificationPrefs={mockNotificationPrefs}
        subscription={null}
      />,
    );

    expect(screen.getByText("Account Settings")).toBeInTheDocument();
    expect(screen.getByText("Profile Information")).toBeInTheDocument();
    expect(screen.getByText("Notification Preferences")).toBeInTheDocument();
    expect(screen.getByText("Subscription")).toBeInTheDocument();
  });

  it("pre-fills profile form with user data", () => {
    render(
      <AccountSettings
        user={mockUser}
        userProfile={mockUserProfile}
        notificationPrefs={mockNotificationPrefs}
        subscription={null}
      />,
    );

    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
  });

  it("updates profile successfully", async () => {
    const user = userEvent.setup();
    render(
      <AccountSettings
        user={mockUser}
        userProfile={mockUserProfile}
        notificationPrefs={mockNotificationPrefs}
        subscription={null}
      />,
    );

    // Update name
    const nameInput = screen.getByLabelText(/full name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Jane Doe");

    // Submit form
    await user.click(screen.getByRole("button", { name: /update profile/i }));

    await waitFor(() => {
      expect(mockActions.updateProfileAction).toHaveBeenCalled();
    });
  });

  it("validates password confirmation", async () => {
    const user = userEvent.setup();
    mockActions.updateProfileAction.mockResolvedValue({
      error: "Passwords do not match",
    });

    render(
      <AccountSettings
        user={mockUser}
        userProfile={mockUserProfile}
        notificationPrefs={mockNotificationPrefs}
        subscription={null}
      />,
    );

    // Fill in mismatched passwords
    await user.type(screen.getByLabelText(/new password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password456");
    await user.click(screen.getByRole("button", { name: /update profile/i }));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
  });

  it("displays notification preferences correctly", () => {
    render(
      <AccountSettings
        user={mockUser}
        userProfile={mockUserProfile}
        notificationPrefs={mockNotificationPrefs}
        subscription={null}
      />,
    );

    const emailSwitch = screen.getByLabelText(/email reminders/i);
    const pushSwitch = screen.getByLabelText(/push notifications/i);

    expect(emailSwitch).toBeChecked();
    expect(pushSwitch).not.toBeChecked();
  });

  it("updates notification preferences", async () => {
    const user = userEvent.setup();
    render(
      <AccountSettings
        user={mockUser}
        userProfile={mockUserProfile}
        notificationPrefs={mockNotificationPrefs}
        subscription={null}
      />,
    );

    // Toggle push notifications
    const pushSwitch = screen.getByLabelText(/push notifications/i);
    await user.click(pushSwitch);

    // Save preferences
    await user.click(
      screen.getByRole("button", { name: /save notification preferences/i }),
    );

    await waitFor(() => {
      expect(
        mockActions.updateNotificationPreferencesAction,
      ).toHaveBeenCalledWith({
        emailEnabled: true,
        pushEnabled: true,
      });
    });
  });

  it("displays free plan information when no subscription", () => {
    render(
      <AccountSettings
        user={mockUser}
        userProfile={mockUserProfile}
        notificationPrefs={mockNotificationPrefs}
        subscription={null}
      />,
    );

    expect(screen.getByText("Free Plan")).toBeInTheDocument();
    expect(
      screen.getByText(
        "You're currently on the free plan with limited features",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /upgrade to premium/i }),
    ).toBeInTheDocument();
  });

  it("displays premium plan information when subscribed", () => {
    render(
      <AccountSettings
        user={mockUser}
        userProfile={mockUserProfile}
        notificationPrefs={mockNotificationPrefs}
        subscription={mockSubscription}
      />,
    );

    expect(screen.getByText("Premium Plan")).toBeInTheDocument();
    expect(screen.getByText("$5.00/month")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /manage subscription/i }),
    ).toBeInTheDocument();
  });

  it("opens Stripe customer portal", async () => {
    const user = userEvent.setup();
    // Mock window.location.href
    delete (window as any).location;
    window.location = { href: "" } as any;

    render(
      <AccountSettings
        user={mockUser}
        userProfile={mockUserProfile}
        notificationPrefs={mockNotificationPrefs}
        subscription={mockSubscription}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /manage subscription/i }),
    );

    await waitFor(() => {
      expect(mockSupabaseInvoke).toHaveBeenCalledWith(
        "supabase-functions-create-customer-portal",
        {
          body: {
            user_id: "user-1",
            return_url: "http://localhost:3000/dashboard/settings",
          },
        },
      );
    });
  });

  it("handles subscription management errors", async () => {
    const user = userEvent.setup();
    mockSupabaseInvoke.mockRejectedValue(
      new Error("Failed to create portal session"),
    );

    render(
      <AccountSettings
        user={mockUser}
        userProfile={mockUserProfile}
        notificationPrefs={mockNotificationPrefs}
        subscription={mockSubscription}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /manage subscription/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Failed to open subscription management"),
      ).toBeInTheDocument();
    });
  });
});
