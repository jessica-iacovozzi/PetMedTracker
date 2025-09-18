"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "../../supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_APP_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    "http://localhost:3000/";
  // Make sure to include `https://` when not localhost.
  url = url.startsWith("http") ? url : `https://${url}`;
  // Make sure to include a trailing `/`.
  url = url.endsWith("/") ? url : `${url}/`;
  return url;
};

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
        name: fullName,
      },
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link.",
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  // Check if user has completed onboarding (has pets)
  if (data.user) {
    const { data: pets } = await supabase
      .from("pets")
      .select("id")
      .eq("user_id", data.user.id)
      .limit(1);

    // If no pets, redirect to onboarding
    if (!pets || pets.length === 0) {
      return redirect("/onboarding");
    }
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/dashboard/reset-password`,
  });

  if (error) {
    console.error(error.message);
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
      "/dashboard/reset-password",
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

  encodedRedirect("success", "/dashboard/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

// Check if user has an active subscription
export const checkUserSubscription = async (userId: string) => {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  return !!subscription;
};

// Pet CRUD operations
export const getPets = async (userId: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pets")
    .select(
      `
      *,
      medications(
        id,
        name,
        dosage,
        frequency,
        timing,
        duration,
        created_at
      )
    `,
    )
    .eq("user_id", userId)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const createPetAction = async (petData: {
  name: string;
  species: string;
  breed?: string;
  age?: string;
  weight?: string;
  photo?: string;
}) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  // Check subscription limits for free users
  const isSubscribed = await checkUserSubscription(user.id);
  if (!isSubscribed) {
    const { data: existingPets } = await supabase
      .from("pets")
      .select("id")
      .eq("user_id", user.id);

    if (existingPets && existingPets.length >= 1) {
      return {
        error: "Free plan allows only 1 pet. Please upgrade to add more pets.",
      };
    }
  }

  try {
    const { data, error } = await supabase
      .from("pets")
      .insert({
        user_id: user.id,
        name: petData.name,
        species: petData.species,
        photo: petData.photo || null,
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { error: "Failed to create pet" };
  }
};

export const updatePetAction = async (
  petId: string,
  petData: {
    name: string;
    species: string;
    breed?: string;
    age?: string;
    weight?: string;
    photo?: string;
  },
) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  try {
    const { data, error } = await supabase
      .from("pets")
      .update({
        name: petData.name,
        species: petData.species,
        photo: petData.photo || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", petId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { error: "Failed to update pet" };
  }
};

export const deletePetAction = async (petId: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  try {
    const { error } = await supabase
      .from("pets")
      .delete()
      .eq("id", petId)
      .eq("user_id", user.id);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { error: "Failed to delete pet" };
  }
};

// Medication CRUD operations
export const getMedications = async (userId: string, petId?: string) => {
  const supabase = await createClient();

  let query = supabase
    .from("medications")
    .select(
      `
      *,
      pets!inner(name, species)
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (petId) {
    query = query.eq("pet_id", petId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const createMedicationAction = async (medicationData: {
  petId: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration?: string;
}) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  // Check subscription limits for free users
  const isSubscribed = await checkUserSubscription(user.id);
  if (!isSubscribed) {
    const { data: existingMedications } = await supabase
      .from("medications")
      .select("id")
      .eq("user_id", user.id);

    if (existingMedications && existingMedications.length >= 2) {
      return {
        error:
          "Free plan allows only 2 medications. Please upgrade to add more medications.",
      };
    }
  }

  try {
    const { data, error } = await supabase
      .from("medications")
      .insert({
        user_id: user.id,
        pet_id: medicationData.petId,
        name: medicationData.name,
        dosage: medicationData.dosage,
        frequency: medicationData.frequency,
        timing: medicationData.timing,
        duration: medicationData.duration || null,
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { error: "Failed to create medication" };
  }
};

export const updateMedicationAction = async (
  medicationId: string,
  medicationData: {
    name: string;
    dosage: string;
    frequency: string;
    timing: string;
    duration?: string;
  },
) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  try {
    const { data, error } = await supabase
      .from("medications")
      .update({
        name: medicationData.name,
        dosage: medicationData.dosage,
        frequency: medicationData.frequency,
        timing: medicationData.timing,
        duration: medicationData.duration || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", medicationId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { error: "Failed to update medication" };
  }
};

export const deleteMedicationAction = async (medicationId: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  try {
    const { error } = await supabase
      .from("medications")
      .delete()
      .eq("id", medicationId)
      .eq("user_id", user.id);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { error: "Failed to delete medication" };
  }
};

// Reminder actions
export const getTodaysRemindersAction = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  try {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
    );

    const { data, error } = await supabase
      .from("reminders")
      .select(
        `
        *,
        pets(name, species),
        medications(name, dosage)
      `,
      )
      .eq("user_id", user.id)
      .gte("scheduled_time", startOfDay.toISOString())
      .lt("scheduled_time", endOfDay.toISOString())
      .order("scheduled_time");

    if (error) {
      return { error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return { error: "Failed to fetch today's reminders" };
  }
};

export const markReminderAsGivenAction = async (reminderId: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  try {
    const { data, error } = await supabase
      .from("reminders")
      .update({ status: "given" })
      .eq("id", reminderId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    // Also add to history
    const { error: historyError } = await supabase.from("history").insert({
      user_id: user.id,
      pet_id: data.pet_id,
      medication_id: data.medication_id,
      dosage: "", // We'll need to get this from the medication
      scheduled_time: data.scheduled_time,
      status: "given",
    });

    if (historyError) {
      console.error("Failed to add to history:", historyError);
    }

    return { success: true, data };
  } catch (error) {
    return { error: "Failed to mark reminder as given" };
  }
};

// History actions
export const getHistoryAction = async (
  petId?: string,
  startDate?: string,
  endDate?: string,
) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  try {
    let query = supabase
      .from("history")
      .select(
        `
        *,
        pets(name, species),
        medications(name, dosage)
      `,
      )
      .eq("user_id", user.id)
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
      return { error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return { error: "Failed to fetch history" };
  }
};

// Account settings actions
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

  try {
    // Update email if changed
    if (email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: email,
      });
      if (emailError) {
        return { error: emailError.message };
      }
    }

    // Update password if provided
    if (password) {
      if (password !== confirmPassword) {
        return { error: "Passwords do not match" };
      }
      if (password.length < 6) {
        return { error: "Password must be at least 6 characters" };
      }
      const { error: passwordError } = await supabase.auth.updateUser({
        password: password,
      });
      if (passwordError) {
        return { error: passwordError.message };
      }
    }

    // Update user profile in the users table
    const { error: profileError } = await supabase.from("users").upsert({
      id: user.id,
      name: name,
      email: email,
      updated_at: new Date().toISOString(),
    });

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
    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: user.id,
        email_enabled: preferences.emailEnabled,
        push_enabled: preferences.pushEnabled,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { error: "Failed to update notification preferences" };
  }
};

export const getNotificationPreferencesAction = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  try {
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found"
      return { error: error.message };
    }

    // Return default preferences if none exist
    const preferences = data || {
      email_enabled: true,
      push_enabled: true,
    };

    return { success: true, data: preferences };
  } catch (error) {
    return { error: "Failed to fetch notification preferences" };
  }
};
