"use server";

import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const supabase = await createClient();

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        email: email,
      },
    },
  });

  if (error) {
    return encodedRedirect("error", "/sign-up", error.message);
  }

  if (user) {
    try {
      const { error: updateError } = await supabase.from("users").insert({
        id: user.id,
        user_id: user.id,
        name: fullName,
        email: email,
        token_identifier: user.id,
        created_at: new Date().toISOString(),
      });

      if (updateError) {
        // Error handling without console.error
        return encodedRedirect(
          "error",
          "/sign-up",
          "Error updating user. Please try again.",
        );
      }
    } catch (err) {
      // Error handling without console.error
      return encodedRedirect(
        "error",
        "/sign-up",
        "Error updating user. Please try again.",
      );
    }
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {});

  if (error) {
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const checkUserSubscription = async (userId: string) => {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error) {
    return false;
  }

  return !!subscription;
};

export const getHistoryLog = async (
  userId: string,
  petId?: string,
  startDate?: string,
  endDate?: string,
) => {
  const supabase = await createClient();

  let query = supabase
    .from("history")
    .select(
      `
      *,
      pets!inner(name, species),
      medications!inner(name, dosage)
    `,
    )
    .eq("user_id", userId)
    .order("scheduled_time", { ascending: false });

  if (petId) {
    query = query.eq("pet_id", petId);
  }

  if (startDate) {
    query = query.gte("scheduled_time", startDate);
  }

  if (endDate) {
    query = query.lte("scheduled_time", endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const getPets = async (userId: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("user_id", userId)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const addHistoryEntry = async (entry: {
  userId: string;
  petId: string;
  medicationId: string;
  dosage: string;
  scheduledTime: string;
  status: "given" | "missed";
}) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("history")
    .insert({
      user_id: entry.userId,
      pet_id: entry.petId,
      medication_id: entry.medicationId,
      dosage: entry.dosage,
      scheduled_time: entry.scheduledTime,
      status: entry.status,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const updateProfileAction = async (formData: FormData) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  const name = formData.get("name")?.toString();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!name || !email) {
    return { error: "Name and email are required" };
  }

  // Validate password if provided
  if (password) {
    if (password !== confirmPassword) {
      return { error: "Passwords do not match" };
    }
    if (password.length < 6) {
      return { error: "Password must be at least 6 characters" };
    }
  }

  try {
    // Update auth user if email or password changed
    const authUpdates: any = {};
    if (email !== user.email) {
      authUpdates.email = email;
    }
    if (password) {
      authUpdates.password = password;
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabase.auth.updateUser(authUpdates);
      if (authError) {
        return { error: authError.message };
      }
    }

    // Update user profile in database
    const { error: profileError } = await supabase
      .from("users")
      .update({
        name: name,
        full_name: name,
        email: email,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (profileError) {
      return { error: profileError.message };
    }

    return { success: true };
  } catch (error) {
    return { error: "Failed to update profile" };
  }
};

export const updateNotificationPreferencesAction = async (preferences: {
  emailEnabled: boolean;
  pushEnabled: boolean;
}) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  try {
    // Check if notification preferences exist
    const { data: existing } = await supabase
      .from("notification_preferences")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      // Update existing preferences
      const { error } = await supabase
        .from("notification_preferences")
        .update({
          email_enabled: preferences.emailEnabled,
          push_enabled: preferences.pushEnabled,
        })
        .eq("user_id", user.id);

      if (error) {
        return { error: error.message };
      }
    } else {
      // Create new preferences
      const { error } = await supabase.from("notification_preferences").insert({
        user_id: user.id,
        email_enabled: preferences.emailEnabled,
        push_enabled: preferences.pushEnabled,
      });

      if (error) {
        return { error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    return { error: "Failed to update notification preferences" };
  }
};
